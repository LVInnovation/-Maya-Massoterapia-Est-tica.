type Row = Record<string, any>;
type Db = Record<string, Row[]>;

const STORAGE_KEY = 'maya_massoterapia_local_database_v1';
const FILE_STORAGE_KEY = 'maya_massoterapia_local_files_v1';

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const now = () => new Date().toISOString();

const defaultProfessionals = [
  {
    id: 'maya-1',
    name: 'Maya',
    specialty: 'Massoterapeuta e Esteticista',
    status: 'active',
    active: true,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=500&fit=crop',
    photo_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=500&fit=crop',
    whatsapp_message: '',
    allow_simultaneous_appointments: false,
    created_at: now(),
  },
  {
    id: 'maya-2',
    name: 'Equipe Maya',
    specialty: 'Estética facial e corporal',
    status: 'active',
    active: true,
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=500&fit=crop',
    photo_url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=500&fit=crop',
    whatsapp_message: '',
    allow_simultaneous_appointments: false,
    created_at: now(),
  },
];

const defaultServices = [
  { id: 'serv-1', professional_id: 'maya-1', name: 'Massagem Relaxante', duration: 60, price: 120, created_at: now() },
  { id: 'serv-2', professional_id: 'maya-1', name: 'Drenagem Linfática', duration: 60, price: 130, created_at: now() },
  { id: 'serv-3', professional_id: 'maya-1', name: 'Liberação Miofascial', duration: 60, price: 140, created_at: now() },
  { id: 'serv-4', professional_id: 'maya-2', name: 'Limpeza de Pele', duration: 60, price: 150, created_at: now() },
  { id: 'serv-5', professional_id: 'maya-2', name: 'Tratamento Facial', duration: 60, price: 160, created_at: now() },
];

const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const defaultWeeklySchedule = defaultProfessionals.flatMap((professional) =>
  weekDays.map((day, index) => ({
    id: uuid(),
    professional_id: professional.id,
    weekday: day,
    week_day: day,
    enabled: index < 6,
    start_time: index === 5 ? '09:00' : '08:00',
    end_time: index === 5 ? '14:00' : '18:00',
    interval_minutes: 30,
    has_lunch_break: false,
    lunch_start: null,
    lunch_end: null,
    created_at: now(),
  })),
);

const defaultDb = (): Db => ({
  professionals: defaultProfessionals,
  services: defaultServices,
  appointments: [],
  weekly_schedule: defaultWeeklySchedule,
  schedule_blocks: [],
  blocked_clients: [],
  site_config: [
    {
      id: 'maya-massoterapia-admin-state',
      config: {
        siteConfig: {
          siteName: 'Maya Massoterapia & Estética',
          footerDescription:
            'Agendamento premium para massoterapia, estética e bem-estar. Uma experiência elegante, acolhedora e profissional.',
          contactEmail: 'contato@mayamassoterapia.com',
          contactPhone: '(11) 99999-9999',
          servicesBadge: 'Bem-estar premium',
          servicesTitle: 'Nossos Serviços',
          servicesSubtitle: 'Massoterapia profissional, estética facial e corporal em um ambiente sofisticado.',
          services: [
            { id: 1, name: 'Massoterapia', description: 'Relaxamento, alívio de tensões e bem-estar' },
            { id: 2, name: 'Drenagem Linfática', description: 'Cuidado corporal leve e profissional' },
            { id: 3, name: 'Estética Facial', description: 'Tratamentos para realçar sua beleza natural' },
            { id: 4, name: 'SPA e Bem-estar', description: 'Experiências de cuidado e sofisticação' },
          ],
        },
      },
      updated_at: now(),
    },
  ],
});

const readDb = (): Db => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = defaultDb();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return { ...defaultDb(), ...JSON.parse(raw) };
  } catch {
    return defaultDb();
  }
};

const writeDb = (db: Db) => localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

const getFiles = () => {
  try {
    return JSON.parse(localStorage.getItem(FILE_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveFiles = (files: Record<string, string>) =>
  localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(files));

const normalize = (value: any) => (value === undefined || value === null ? value : String(value));

const matches = (row: Row, filter: { type: string; column: string; value: any }) => {
  const current = filter.column === 'weekday' && row.weekday === undefined ? row.week_day : row[filter.column];
  if (filter.type === 'eq') return normalize(current) === normalize(filter.value);
  if (filter.type === 'neq') return normalize(current) !== normalize(filter.value);
  if (filter.type === 'not_in') {
    const values = String(filter.value).replace(/[()]/g, '').split(',').map((v) => v.trim());
    return !values.includes(String(current));
  }
  return true;
};

const withRelations = (table: string, rows: Row[], db: Db) => {
  if (table !== 'appointments') return rows;
  return rows.map((appointment) => ({
    ...appointment,
    professionals: db.professionals.find((p) => normalize(p.id) === normalize(appointment.professional_id)) || null,
    services: db.services.find((s) => normalize(s.id) === normalize(appointment.service_id)) || null,
  }));
};

type QueryResult = { data: any; error: any };

class LocalQuery implements PromiseLike<QueryResult> {
  private filters: { type: string; column: string; value: any }[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private mode: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private singleMode: 'single' | 'maybeSingle' | null = null;
  private returning = false;

  constructor(private table: string) {}

  select(_columns?: string) {
    this.returning = true;
    return this;
  }

  insert(payload: any) {
    this.mode = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.mode = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  upsert(payload: any) {
    this.mode = 'upsert';
    this.payload = payload;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'in') this.filters.push({ type: 'not_in', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(_count: number) {
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this;
  }

  private run(): Promise<QueryResult> {
    const db = readDb();
    db[this.table] = db[this.table] || [];
    let data: any = null;

    if (this.mode === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = items.map((item) => ({ id: item.id || uuid(), created_at: item.created_at || now(), ...item }));
      db[this.table].push(...inserted);
      writeDb(db);
      data = inserted;
    } else if (this.mode === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const saved = items.map((item) => {
        const id = item.id || uuid();
        const index = db[this.table].findIndex((row) => normalize(row.id) === normalize(id));
        const next = { ...(index >= 0 ? db[this.table][index] : {}), ...item, id };
        if (index >= 0) db[this.table][index] = next;
        else db[this.table].push({ created_at: now(), ...next });
        return next;
      });
      writeDb(db);
      data = saved;
    } else if (this.mode === 'update') {
      const updated: Row[] = [];
      db[this.table] = db[this.table].map((row) => {
        if (this.filters.every((filter) => matches(row, filter))) {
          const next = { ...row, ...this.payload, updated_at: now() };
          updated.push(next);
          return next;
        }
        return row;
      });
      writeDb(db);
      data = updated;
    } else if (this.mode === 'delete') {
      const removed: Row[] = [];
      db[this.table] = db[this.table].filter((row) => {
        const shouldRemove = this.filters.every((filter) => matches(row, filter));
        if (shouldRemove) removed.push(row);
        return !shouldRemove;
      });
      writeDb(db);
      data = removed;
    } else {
      data = db[this.table].filter((row) => this.filters.every((filter) => matches(row, filter)));
    }

    data = withRelations(this.table, Array.isArray(data) ? data : [data].filter(Boolean), db);

    for (const order of [...this.orders].reverse()) {
      data.sort((a: Row, b: Row) => {
        const av = a[order.column] ?? '';
        const bv = b[order.column] ?? '';
        return order.ascending ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }

    if (this.singleMode) data = data[0] || null;
    else if ((this.mode === 'insert' || this.mode === 'update' || this.mode === 'upsert') && this.returning && !Array.isArray(this.payload)) data = data[0] || null;

    return Promise.resolve({ data, error: null });
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  from(table: string) {
    return new LocalQuery(table);
  },
  storage: {
    from(_bucket: string) {
      return {
        async upload(path: string, file: File, _options?: Record<string, unknown>) {
          const files = getFiles();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          files[path] = dataUrl;
          saveFiles(files);
          return { data: { path }, error: null };
        },
        getPublicUrl(path: string) {
          const files = getFiles();
          return { data: { publicUrl: files[path] || path } };
        },
      };
    },
  },
};
