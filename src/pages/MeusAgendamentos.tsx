import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { defaultSiteConfig, SiteConfig } from '../content/siteContent'
import { loadSiteConfigFromDatabase } from '../services/siteConfig'
import { supabase } from '../services/supabase'

interface Appointment {
  id: string
  clientName: string
  phone: string
  professionalName: string
  serviceName: string
  date: string
  time: string
  duration: string
  status: string
  packageId?: string
  sessionDebited?: boolean
}

type DatabaseAppointment = {
  id: string
  client_name: string | null
  phone: string | null
  client_phone: string | null
  appointment_date: string
  appointment_time: string
  status: string | null
  package_id?: string | null
  session_debited?: boolean | null
  professionals: { name: string | null } | null
  services: { name: string | null; duration: number | string | null } | null
}

type PackageStatus = 'ativo' | 'finalizado' | 'vencido' | 'cancelado'

interface ClientPackage {
  id: string
  clientName: string
  phone: string
  normalizedPhone: string
  packageName: string
  packageCode: string
  totalSessions: number
  sessionsUsed: number
  purchaseDate: string
  expirationDate: string
  status: PackageStatus
  serviceNames: string[]
}

type DatabaseClientPackage = {
  id: string
  client_name: string | null
  phone: string | null
  normalized_phone: string | null
  package_name: string | null
  package_code: string | null
  total_sessions: number | string | null
  sessions_used: number | string | null
  purchase_date: string | null
  expiration_date: string | null
  status: string | null
}

type DatabasePackageServiceLink = {
  package_id: string | number | null
  services: { name: string | null } | null
}

const onlyDigits = (value?: string | null) => String(value || '').replace(/\D/g, '')

const normalizePhone = (value?: string | null) => {
  const digits = onlyDigits(value)

  // Remove codigo do Brasil se vier salvo como 5511999999999
  if (digits.length === 13 && digits.startsWith('55')) {
    return digits.slice(2)
  }

  return digits
}

const phonesMatch = (savedPhone: string | null | undefined, searchedPhone: string) => {
  const saved = normalizePhone(savedPhone)
  const searched = normalizePhone(searchedPhone)

  if (!saved || !searched) return false

  // Comparacao exata, quando os dois estao no mesmo formato limpo
  if (saved === searched) return true

  // Comparacao por final do numero para ignorar DDD, 9 extra ou codigo 55
  const savedLast8 = saved.slice(-8)
  const searchedLast8 = searched.slice(-8)
  const savedLast9 = saved.slice(-9)
  const searchedLast9 = searched.slice(-9)

  return savedLast8 === searchedLast8 || savedLast9 === searchedLast9
}

const formatDateLabel = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'confirmado':
    case 'confirmed':
      return { badge: 'border border-green-400/30 bg-green-400/10 text-green-300', border: 'border-green-400/25' }
    case 'cancelado':
    case 'canceled':
      return { badge: 'border border-red-400/30 bg-red-400/10 text-red-300', border: 'border-red-400/25' }
    default:
      return { badge: 'border border-gold-400/30 bg-gold-400/10 text-gold-300', border: 'border-gold-400/25' }
  }
}

const getStatusLabel = (status: string | undefined, content: SiteConfig) => {
  switch (status) {
    case 'confirmado':
    case 'confirmed':
      return content.appointmentsPage.statusConfirmed
    case 'cancelado':
    case 'canceled':
      return content.appointmentsPage.statusCanceled
    default:
      return content.appointmentsPage.statusScheduled
  }
}

const formatShortDate = (value?: string) => {
  if (!value) return '-'

  try {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
  } catch {
    return value
  }
}

const normalizePackageCode = (value?: string | null) => String(value || '').trim().toUpperCase()

const todayKey = () => new Date().toISOString().slice(0, 10)

const toPackageStatus = (value?: string | null): PackageStatus => {
  if (value === 'finalizado' || value === 'vencido' || value === 'cancelado') return value
  return 'ativo'
}

const getSessionsRemaining = (item: Pick<ClientPackage, 'totalSessions' | 'sessionsUsed'>) =>
  Math.max(0, item.totalSessions - item.sessionsUsed)

const resolvePackageStatus = (item: ClientPackage): PackageStatus => {
  if (item.status === 'cancelado' || item.status === 'finalizado') return item.status
  if (getSessionsRemaining(item) === 0) return 'finalizado'
  if (item.expirationDate && item.expirationDate < todayKey()) return 'vencido'
  return 'ativo'
}

const packageStatusLabels: Record<PackageStatus, string> = {
  ativo: 'Ativo',
  finalizado: 'Finalizado',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
}

const packageStatusStyles: Record<PackageStatus, string> = {
  ativo: 'border-green-400/30 bg-green-400/10 text-green-300',
  finalizado: 'border-gold-400/30 bg-gold-400/10 text-gold-300',
  vencido: 'border-orange-300/30 bg-orange-300/10 text-orange-200',
  cancelado: 'border-red-400/30 bg-red-400/10 text-red-300',
}

const mapPackageRow = (
  row: DatabaseClientPackage,
  serviceNames: string[],
): ClientPackage => {
  const item: ClientPackage = {
    id: String(row.id),
    clientName: row.client_name || '',
    phone: row.phone || '',
    normalizedPhone: row.normalized_phone || normalizePhone(row.phone),
    packageName: row.package_name || '',
    packageCode: row.package_code || '',
    totalSessions: Number(row.total_sessions || 0),
    sessionsUsed: Number(row.sessions_used || 0),
    purchaseDate: row.purchase_date || '',
    expirationDate: row.expiration_date || '',
    status: toPackageStatus(row.status),
    serviceNames,
  }

  return { ...item, status: resolvePackageStatus(item) }
}



const canReturnPackageSession = (appointment: Appointment) => {
  const appointmentDate = new Date(`${appointment.date}T${appointment.time || '00:00'}:00`)
  const diffMs = appointmentDate.getTime() - Date.now()
  return diffMs >= 3 * 60 * 60 * 1000
}

const returnPackageSessionIfAllowed = async (appointment: Appointment) => {
  if (!appointment.packageId || !appointment.sessionDebited) {
    return false
  }

  const { data: packageData, error: packageReadError } = await supabase
    .from('maya_client_packages')
    .select('*')
    .eq('id', appointment.packageId)
    .maybeSingle()

  if (packageReadError) throw packageReadError
  if (!packageData) return false

  const currentUsed = Math.max(0, Number((packageData as any).sessions_used || 0))
  const canReturn = canReturnPackageSession(appointment)

  if (!canReturn) {
    await supabase.from('maya_package_sessions').insert({
      package_id: appointment.packageId,
      appointment_id: appointment.id,
      used_at: new Date().toISOString(),
      session_number: currentUsed,
      action: 'late_cancel',
      notes: 'Cancelamento com menos de 3 horas. A sessão foi mantida como usada.',
    })
    return false
  }

  const nextUsed = Math.max(0, currentUsed - 1)

  const { error: packageUpdateError } = await supabase
    .from('maya_client_packages')
    .update({ sessions_used: nextUsed, status: 'ativo' })
    .eq('id', appointment.packageId)

  if (packageUpdateError) throw packageUpdateError

  const { error: sessionReturnError } = await supabase.from('maya_package_sessions').insert({
    package_id: appointment.packageId,
    appointment_id: appointment.id,
    used_at: new Date().toISOString(),
    session_number: nextUsed,
    action: 'returned',
    notes: 'Sessão devolvida por cancelamento com mais de 3 horas de antecedência.',
  })

  if (sessionReturnError) throw sessionReturnError

  await supabase
    .from('maya_appointments')
    .update({ session_debited: false })
    .eq('id', appointment.id)

  return true
}

const MeusAgendamentos = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(defaultSiteConfig)
  const [phone, setPhone] = useState('')
  const [packageCode, setPackageCode] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchedPhone, setSearchedPhone] = useState(false)
  const [error, setError] = useState('')
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = useState('')

  useEffect(() => {
    loadSiteConfigFromDatabase()
      .then(setSiteConfig)
      .catch(() => setSiteConfig(defaultSiteConfig))
  }, [])

  useEffect(() => {
    document.title = `${siteConfig.appointmentsPage.title} - ${siteConfig.siteName}`
  }, [siteConfig.appointmentsPage.title, siteConfig.siteName])

  const formatPhone = (value: string) => {
    const digits = onlyDigits(value).slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const handlePackageCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPackageCode(e.target.value.toUpperCase())
  }

  const searchAppointments = async () => {
    const digits = normalizePhone(phone)
    const typedPackageCode = normalizePackageCode(packageCode)
    const shouldSearchByPhone = digits.length >= 8
    const shouldSearchByCode = Boolean(typedPackageCode)

    if (!shouldSearchByPhone && !shouldSearchByCode) {
      setError('Digite um telefone valido ou informe o codigo do pacote.')
      return
    }

    setLoading(true)
    setError('')
    setCancelSuccess('')
    setSearched(false)
    setSearchedPhone(shouldSearchByPhone)

    try {
      const appointmentsRequest = shouldSearchByPhone
        ? supabase
            .from('maya_appointments')
            .select(`
              id,
              client_name,
              phone,
              client_phone,
              appointment_date,
              appointment_time,
              status,
              package_id,
              session_debited,
              professionals:maya_professional(name),
              services:maya_services(name, duration)
            `)
            .not('status', 'in', '(cancelado,canceled)')
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true })
        : Promise.resolve({ data: [] as DatabaseAppointment[], error: null })

      const phonePackagesRequest = shouldSearchByPhone
        ? supabase
            .from('maya_client_packages')
            .select('*')
            .eq('normalized_phone', digits)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as DatabaseClientPackage[], error: null })

      const codePackageRequest = shouldSearchByCode
        ? supabase
            .from('maya_client_packages')
            .select('*')
            .eq('package_code', typedPackageCode)
            .maybeSingle()
        : Promise.resolve({ data: null as DatabaseClientPackage | null, error: null })

      const [appointmentsResponse, phonePackagesResponse, codePackageResponse] = await Promise.all([
        appointmentsRequest,
        phonePackagesRequest,
        codePackageRequest,
      ])

      if (appointmentsResponse.error) throw appointmentsResponse.error
      if (phonePackagesResponse.error) throw phonePackagesResponse.error
      if (codePackageResponse.error) throw codePackageResponse.error

      const mapped: Appointment[] = ((appointmentsResponse.data || []) as unknown as DatabaseAppointment[])
        .filter((item) => !shouldSearchByPhone || phonesMatch(item.phone, digits) || phonesMatch(item.client_phone, digits))
        .map((item) => ({
          id: item.id,
          clientName: item.client_name || '',
          phone: item.phone || item.client_phone || '',
          professionalName: item.professionals?.name || '',
          serviceName: item.services?.name || '',
          date: item.appointment_date,
          time: item.appointment_time?.slice(0, 5) || '',
          duration: item.services?.duration ? `${item.services.duration} min` : '',
          status: item.status || 'agendado',
          packageId: item.package_id || undefined,
          sessionDebited: item.session_debited === true,
        }))

      const today = todayKey()
      const upcoming = mapped.filter((a) => a.date >= today)

      const packageRowsById = new Map<string, DatabaseClientPackage>()

      ;((phonePackagesResponse.data || []) as DatabaseClientPackage[]).forEach((row) => {
        packageRowsById.set(String(row.id), row)
      })

      if (codePackageResponse.data) {
        packageRowsById.set(String(codePackageResponse.data.id), codePackageResponse.data as DatabaseClientPackage)
      }

      const packageRows = Array.from(packageRowsById.values())
      let visiblePackages: ClientPackage[] = []

      if (packageRows.length > 0) {
        const packageIds = packageRows.map((row) => String(row.id))
        const { data: serviceLinksData, error: serviceLinksError } = await supabase
          .from('maya_package_services')
          .select('package_id, services:maya_services(name)')
          .in('package_id', packageIds)

        if (serviceLinksError) throw serviceLinksError

        const serviceNamesByPackageId = ((serviceLinksData || []) as DatabasePackageServiceLink[]).reduce<Record<string, string[]>>((result, link) => {
          const packageId = String(link.package_id || '')
          const serviceName = link.services?.name?.trim()

          if (!packageId || !serviceName) return result

          if (!result[packageId]) result[packageId] = []
          if (!result[packageId].includes(serviceName)) result[packageId].push(serviceName)

          return result
        }, {})

        visiblePackages = packageRows
          .map((row) => mapPackageRow(row, serviceNamesByPackageId[String(row.id)] || []))
          .filter((item) => item.status === 'ativo')
      }

      setAppointments(shouldSearchByPhone ? upcoming : [])
      setClientPackages(visiblePackages)
      setSearched(true)
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError(siteConfig.appointmentsPage.searchError)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (id: string) => {
    if (!confirm(siteConfig.appointmentsPage.cancelConfirm)) return

    setCancelingId(id)
    setError('')

    try {
      const appointment = appointments.find((item) => item.id === id)
      const returnedSession = appointment ? await returnPackageSessionIfAllowed(appointment) : false

      const { error: supabaseError } = await supabase
        .from('maya_appointments')
        .update({ status: 'cancelado' })
        .eq('id', id)

      if (supabaseError) throw supabaseError

      setAppointments((prev) => prev.filter((a) => a.id !== id))
      setCancelSuccess(returnedSession ? `${siteConfig.appointmentsPage.cancelSuccess} A sessão voltou para o pacote.` : appointment?.packageId ? `${siteConfig.appointmentsPage.cancelSuccess} Cancelamento com menos de 3 horas: a sessão do pacote foi mantida como usada.` : siteConfig.appointmentsPage.cancelSuccess)
    } catch (err) {
      console.error('Erro ao cancelar:', err)
      setError(siteConfig.appointmentsPage.cancelError)
    } finally {
      setCancelingId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') searchAppointments()
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-dark-900">
      <div className="border-b border-gold-400/20 bg-dark-800/90 shadow-dark-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div>
            <h1 className="font-serif text-xl font-bold text-gold-400 sm:text-2xl">{siteConfig.appointmentsPage.title}</h1>
            <p className="text-xs text-gray-400">{siteConfig.appointmentsPage.subtitle}</p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-sm font-semibold text-gold-300 transition-colors hover:bg-gold-400/15"
          >
            {siteConfig.buttons.backToSite}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-6 shadow-card">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/15">
              <svg className="h-7 w-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h2 className="font-serif text-lg font-bold text-gold-300">{siteConfig.appointmentsPage.phoneCardTitle}</h2>
            <p className="mt-1 text-sm text-gray-400">
              {siteConfig.appointmentsPage.phoneCardDescription}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                {siteConfig.appointmentsPage.phoneCardTitle}
              </p>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                placeholder={siteConfig.appointmentsPage.phonePlaceholder}
                className="min-w-0 w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-center text-base font-semibold tracking-wide text-gray-100 outline-none placeholder:font-normal placeholder:text-gray-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:text-lg"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Consultar pacote por codigo
              </p>
              <input
                type="text"
                value={packageCode}
                onChange={handlePackageCodeChange}
                onKeyDown={handleKeyDown}
                placeholder="MAYA-ABCDE"
                className="min-w-0 w-full rounded-2xl border border-gold-400/20 bg-dark-800 px-4 py-3 text-center text-base font-semibold tracking-[0.3em] text-gray-100 uppercase outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 sm:text-lg"
              />
            </div>

            <button
              type="button"
              onClick={searchAppointments}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-400 px-5 py-3 font-semibold text-dark-900 shadow-md shadow-gold-400/20 transition-colors hover:bg-gold-300 disabled:opacity-60"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                  <span>Consultar</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-2 text-center text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        {cancelSuccess && (
          <div className="mt-4 rounded-2xl border border-green-400/30 bg-green-950/30 px-4 py-3 text-center text-sm font-medium text-green-300">
            ✓ {cancelSuccess}
          </div>
        )}

        {searchedPhone && (
          <div className="mt-6">
            {appointments.length === 0 ? (
              <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-8 text-center shadow-card">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/10">
                  <svg className="h-7 w-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-100">{siteConfig.appointmentsPage.emptyTitle}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {siteConfig.appointmentsPage.emptyDescription}
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded-full bg-gold-400 px-6 py-2.5 text-sm font-semibold text-dark-900 shadow-md shadow-gold-400/20 transition-colors hover:bg-gold-300"
                >
                  {siteConfig.buttons.makeAppointment}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm font-medium text-gray-400">
                  {appointments.length}{' '}
                  {appointments.length > 1
                    ? siteConfig.appointmentsPage.foundPlural
                    : siteConfig.appointmentsPage.foundSingular}
                </p>

                {appointments.map((appointment) => {
                  const style = getStatusStyle(appointment.status)
                  const isCanceling = cancelingId === appointment.id

                  return (
                    <div
                      key={appointment.id}
                      className={`rounded-3xl border bg-dark-700 p-5 shadow-card ${style.border}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-100">{appointment.clientName}</p>
                          <p className="text-sm font-medium text-gold-300">{appointment.professionalName}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
                          {getStatusLabel(appointment.status, siteConfig)}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="capitalize">{formatDateLabel(appointment.date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{appointment.time}{appointment.duration ? ` • ${appointment.duration}` : ''}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <span>{appointment.serviceName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => cancelAppointment(appointment.id)}
                        disabled={isCanceling}
                        className="mt-4 w-full rounded-2xl border border-red-400/30 bg-red-950/30 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/50 disabled:opacity-60"
                      >
                        {isCanceling ? siteConfig.buttons.saving : siteConfig.buttons.cancelAppointment}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {searched && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gold-400/10" />
              <h2 className="font-serif text-xl font-bold text-gold-300">Meus Pacotes</h2>
              <div className="h-px flex-1 bg-gold-400/10" />
            </div>

            {clientPackages.length === 0 ? (
              <div className="rounded-3xl border border-gold-400/20 bg-dark-700 p-6 text-center shadow-card">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/10">
                  <svg className="h-7 w-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-100">Nenhum pacote ativo encontrado</p>
                <p className="mt-1 text-sm text-gray-400">
                  Busque pelo telefone cadastrado ou informe um codigo de pacote valido.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientPackages.map((item) => {
                  const remaining = getSessionsRemaining(item)

                  return (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-gold-400/20 bg-gradient-to-br from-dark-700 to-dark-800 p-5 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Pacote ativo</p>
                          <h3 className="mt-1 font-serif text-xl font-bold text-gold-300">{item.packageName || 'Pacote Maya'}</h3>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${packageStatusStyles[item.status]}`}>
                          {packageStatusLabels[item.status]}
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl border border-gold-400/20 bg-dark-900/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-400">Codigo do pacote</p>
                        <p className="mt-1 font-mono text-base font-semibold tracking-[0.25em] text-gold-300">
                          {item.packageCode || 'Sem codigo'}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                        <p><strong className="text-gray-100">Sessoes restantes:</strong> {remaining}</p>
                        <p><strong className="text-gray-100">Total de sessoes:</strong> {item.totalSessions}</p>
                        <p><strong className="text-gray-100">Validade:</strong> {formatShortDate(item.expirationDate)}</p>
                        <p><strong className="text-gray-100">Status:</strong> {packageStatusLabels[item.status]}</p>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Servicos inclusos</p>
                        <div className="flex flex-wrap gap-2">
                          {item.serviceNames.length > 0 ? item.serviceNames.map((name) => (
                            <span key={`${item.id}-${name}`} className="rounded-full border border-gold-400/20 bg-gold-400/10 px-3 py-1 text-xs text-gold-200">
                              {name}
                            </span>
                          )) : (
                            <span className="text-xs text-gray-500">Nenhum servico vinculado</span>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MeusAgendamentos
