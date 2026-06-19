import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

function randomUUID(): string {
  return globalThis.crypto.randomUUID()
}

const DATA_DIR = join(process.cwd(), '.dev-data')
const STORE_PATH = join(DATA_DIR, 'store.json')

type Row = Record<string, unknown>

interface Store {
  organisations: Row[]
  users: Row[]
  ontologies: Row[]
  user_contexts: Row[]
  connectors: Row[]
  data_snapshots: Row[]
  insights: Row[]
  digest_deliveries: Row[]
  workflow_triggers: Row[]
}

const EMPTY_STORE: Store = {
  organisations: [],
  users: [],
  ontologies: [],
  user_contexts: [],
  connectors: [],
  data_snapshots: [],
  insights: [],
  digest_deliveries: [],
  workflow_triggers: [],
}

function loadStore(): Store {
  if (!existsSync(STORE_PATH)) return structuredClone(EMPTY_STORE)
  try {
    return { ...EMPTY_STORE, ...JSON.parse(readFileSync(STORE_PATH, 'utf8')) }
  } catch {
    return structuredClone(EMPTY_STORE)
  }
}

function saveStore(store: Store) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
}

function getTable(store: Store, name: string): Row[] {
  if (!(name in store)) throw new Error(`Unknown table: ${name}`)
  return store[name as keyof Store]
}

type Filter = { type: 'eq' | 'in' | 'gte' | 'lte'; col: string; value: unknown }

type QueryResult = { data: unknown; error: { message: string } | null }

class DevQueryBuilder implements PromiseLike<QueryResult> {
  private table: string
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private filters: Filter[] = []
  private payload: Row | Row[] | null = null
  private orderCol?: string
  private orderAsc = true
  private limitN?: number
  private resultMode: 'many' | 'single' | 'maybeSingle' = 'many'
  private selectCols = '*'

  constructor(table: string) {
    this.table = table
  }

  select(cols = '*') {
    if (this.op === 'insert' || this.op === 'update') {
      this.selectCols = cols
      return this
    }
    this.op = 'select'
    this.selectCols = cols
    return this
  }

  insert(data: Row | Row[]) {
    this.op = 'insert'
    this.payload = data
    return this
  }

  update(data: Row) {
    this.op = 'update'
    this.payload = data
    return this
  }

  delete() {
    this.op = 'delete'
    return this
  }

  eq(col: string, value: unknown) {
    this.filters.push({ type: 'eq', col, value })
    return this
  }

  in(col: string, values: unknown[]) {
    this.filters.push({ type: 'in', col, value: values })
    return this
  }

  gte(col: string, value: unknown) {
    this.filters.push({ type: 'gte', col, value })
    return this
  }

  lte(col: string, value: unknown) {
    this.filters.push({ type: 'lte', col, value })
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col
    this.orderAsc = opts?.ascending !== false
    return this
  }

  limit(n: number) {
    this.limitN = n
    return this
  }

  single() {
    this.resultMode = 'single'
    return this
  }

  maybeSingle() {
    this.resultMode = 'maybeSingle'
    return this
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected)
  }

  private matches(row: Row, filter: Filter): boolean {
    const val = row[filter.col]
    switch (filter.type) {
      case 'eq':
        return val === filter.value
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(val)
      case 'gte':
        return val != null && filter.value != null && val >= filter.value
      case 'lte':
        return val != null && filter.value != null && val <= filter.value
    }
  }

  private applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) => this.filters.every((f) => this.matches(row, f)))
  }

  private sortRows(rows: Row[]): Row[] {
    if (!this.orderCol) return rows
    return [...rows].sort((a, b) => {
      const av = a[this.orderCol!]
      const bv = b[this.orderCol!]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = av < bv ? -1 : 1
      return this.orderAsc ? cmp : -cmp
    })
  }

  private withDefaults(table: string, row: Row): Row {
    const now = new Date().toISOString()
    const base: Row = { id: randomUUID(), created_at: now, ...row }
    if (table === 'ontologies') {
      base.customer_definition ??= {}
      base.revenue_model ??= {}
      base.cost_structure ??= {}
      base.departments ??= []
      base.saas_connections ??= []
      base.version ??= 1
    }
    if (table === 'users') {
      base.rbac_permissions ??= {}
      base.timezone ??= 'UTC'
      base.notification_prefs ??= { email: true, slack: true, digest_time: '07:00' }
    }
    if (table === 'connectors') base.status ??= 'active'
    if (table === 'insights') {
      base.category ??= 'general'
      base.severity ??= 'info'
      base.metric_refs ??= []
      base.suggested_actions ??= []
      base.status ??= 'new'
      base.generated_at ??= now
    }
    if (table === 'user_contexts') {
      base.conversation_history ??= []
      base.preference_signals ??= {}
      base.last_active ??= now
    }
    if (table === 'data_snapshots') {
      base.raw_data ??= {}
      base.synced_at ??= now
    }
    if (table === 'workflow_triggers') {
      base.payload ??= {}
      base.status ??= 'pending'
      base.triggered_at ??= now
    }
    if (table === 'digest_deliveries') {
      base.insight_ids ??= []
      base.delivered_at ??= now
    }
    if (table === 'organisations') base.ontology_version ??= 0
    return base
  }

  private execute(): Promise<QueryResult> {
    const store = loadStore()
    const table = getTable(store, this.table)

    if (this.op === 'insert') {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload!]
      const inserted = rows.map((row) => this.withDefaults(this.table, row))
      table.push(...inserted)
      saveStore(store)
      const result = inserted.length === 1 ? inserted[0] : inserted
      return Promise.resolve({ data: result, error: null })
    }

    if (this.op === 'update') {
      const matches = this.applyFilters(table)
      for (const row of matches) Object.assign(row, this.payload)
      saveStore(store)
      return Promise.resolve({ data: matches, error: null })
    }

    if (this.op === 'delete') {
      const before = table.length
      const remaining = table.filter((row) => !this.filters.every((f) => this.matches(row, f)))
      store[this.table as keyof Store] = remaining as never
      saveStore(store)
      return Promise.resolve({ data: before - remaining.length, error: null })
    }

    let rows = this.applyFilters([...table])
    rows = this.sortRows(rows)
    if (this.limitN != null) rows = rows.slice(0, this.limitN)

    if (this.resultMode === 'single') {
      if (rows.length !== 1) {
        return Promise.resolve({ data: null, error: { message: rows.length === 0 ? 'No rows found' : 'Multiple rows found' } })
      }
      return Promise.resolve({ data: rows[0], error: null })
    }

    if (this.resultMode === 'maybeSingle') {
      return Promise.resolve({ data: rows[0] ?? null, error: null })
    }

    return Promise.resolve({ data: rows, error: null })
  }
}

export function createDevSupabaseClient() {
  return {
    from: (table: string) => new DevQueryBuilder(table),
  }
}

export async function isSupabaseReachable(url: string): Promise<boolean> {
  if (!url || url.includes('placeholder')) return false
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}
