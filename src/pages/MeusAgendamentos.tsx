import { useState } from 'react'
import { Link } from 'react-router-dom'
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
}

type DatabaseAppointment = {
  id: string
  client_name: string | null
  phone: string | null
  client_phone: string | null
  appointment_date: string
  appointment_time: string
  status: string | null
  professionals: { name: string | null } | null
  services: { name: string | null; duration: number | string | null } | null
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
      return { badge: 'bg-green-100 text-green-700', border: 'border-green-200' }
    case 'cancelado':
    case 'canceled':
      return { badge: 'bg-red-100 text-red-600', border: 'border-red-200' }
    default:
      return { badge: 'bg-pink-100 text-pink-600', border: 'border-pink-200' }
  }
}

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'confirmado':
    case 'confirmed':
      return 'Confirmado'
    case 'cancelado':
    case 'canceled':
      return 'Cancelado'
    default:
      return 'Agendado'
  }
}

const MeusAgendamentos = () => {
  const [phone, setPhone] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = useState('')

  const formatPhone = (value: string) => {
    const digits = onlyDigits(value).slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const searchAppointments = async () => {
    const digits = normalizePhone(phone)

    if (digits.length < 8) {
      setError('Digite um telefone valido.')
      return
    }

    setLoading(true)
    setError('')
    setCancelSuccess('')
    setSearched(false)

    try {
      // Busca todos os agendamentos nao cancelados e filtra o telefone no app.
      // Isso evita erro quando o telefone esta salvo com mascara, sem mascara,
      // com DDD, sem DDD ou com codigo 55.
      const { data, error: supabaseError } = await supabase
        .from('appointments')
        .select(`
          id,
          client_name,
          phone,
          client_phone,
          appointment_date,
          appointment_time,
          status,
          professionals(name),
          services(name, duration)
        `)
        .not('status', 'in', '(cancelado,canceled)')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (supabaseError) throw supabaseError

      const mapped: Appointment[] = ((data || []) as unknown as DatabaseAppointment[])
        .filter((item) => phonesMatch(item.phone, digits) || phonesMatch(item.client_phone, digits))
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
        }))

      const today = new Date().toISOString().slice(0, 10)
      const upcoming = mapped.filter((a) => a.date >= today)

      setAppointments(upcoming)
      setSearched(true)
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError('Erro ao buscar agendamentos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return

    setCancelingId(id)
    setError('')

    try {
      const { error: supabaseError } = await supabase
        .from('appointments')
        .update({ status: 'cancelado' })
        .eq('id', id)

      if (supabaseError) throw supabaseError

      setAppointments((prev) => prev.filter((a) => a.id !== id))
      setCancelSuccess('Agendamento cancelado com sucesso.')
    } catch (err) {
      console.error('Erro ao cancelar:', err)
      setError('Erro ao cancelar agendamento. Tente novamente.')
    } finally {
      setCancelingId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') searchAppointments()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50">
      <div className="border-b border-pink-100 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">Meus Agendamentos</h1>
            <p className="text-xs text-gray-500">Consulte e cancele seus horários</p>
          </div>
          <Link
            to="/"
            className="rounded-full bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-500 hover:bg-pink-100 transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100">
              <svg className="h-7 w-7 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Digite seu telefone</h2>
            <p className="mt-1 text-sm text-gray-500">
              Buscaremos todos os seus agendamentos futuros
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onKeyDown={handleKeyDown}
              placeholder="(11) 99999-9999"
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-center text-lg font-semibold tracking-wide text-gray-800 outline-none placeholder:font-normal placeholder:text-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
            <button
              type="button"
              onClick={searchAppointments}
              disabled={loading}
              className="rounded-2xl bg-pink-500 px-5 py-3 font-semibold text-white shadow-md hover:bg-pink-600 disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {cancelSuccess && (
          <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
            ✓ {cancelSuccess}
          </div>
        )}

        {searched && (
          <div className="mt-6">
            {appointments.length === 0 ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700">Nenhum agendamento encontrado</p>
                <p className="mt-1 text-sm text-gray-500">
                  Não encontramos agendamentos futuros para este número.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded-full bg-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-pink-600 transition-colors"
                >
                  Fazer agendamento
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm font-medium text-gray-500">
                  {appointments.length} agendamento{appointments.length > 1 ? 's' : ''} encontrado{appointments.length > 1 ? 's' : ''}
                </p>

                {appointments.map((appointment) => {
                  const style = getStatusStyle(appointment.status)
                  const isCanceling = cancelingId === appointment.id

                  return (
                    <div
                      key={appointment.id}
                      className={`rounded-3xl border bg-white p-5 shadow-sm ${style.border}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">{appointment.clientName}</p>
                          <p className="text-sm text-pink-600 font-medium">{appointment.professionalName}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="capitalize">{formatDateLabel(appointment.date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{appointment.time}{appointment.duration ? ` • ${appointment.duration}` : ''}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 shrink-0 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <span>{appointment.serviceName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => cancelAppointment(appointment.id)}
                        disabled={isCanceling}
                        className="mt-4 w-full rounded-2xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 transition-colors"
                      >
                        {isCanceling ? 'Cancelando...' : 'Cancelar agendamento'}
                      </button>
                    </div>
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
