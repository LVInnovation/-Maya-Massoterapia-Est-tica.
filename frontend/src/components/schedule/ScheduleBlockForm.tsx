import { useEffect, useState } from 'react';
import { ScheduleBlock } from './types';

interface AvailableBlockDate {
  dateKey: string;
  label: string;
}

const ScheduleBlockForm = ({
  availableDates,
  onAdd,
}: {
  availableDates: AvailableBlockDate[];
  onAdd: (block: ScheduleBlock) => void;
}) => {
  const [date, setDate] = useState(availableDates[0]?.dateKey || '');
  const [type, setType] = useState<'full-day' | 'time-range'>('full-day');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('15:00');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!date && availableDates.length > 0) {
      setDate(availableDates[0].dateKey);
    }

    if (date && !availableDates.some((item) => item.dateKey === date)) {
      setDate(availableDates[0]?.dateKey || '');
    }
  }, [availableDates, date]);

  const handleAdd = () => {
    if (!date) return;
    if (type === 'time-range' && (!startTime || !endTime)) return;

    onAdd({
      id: `block-${date}-${Date.now()}`,
      date,
      type,
      startTime: type === 'time-range' ? startTime : undefined,
      endTime: type === 'time-range' ? endTime : undefined,
      reason: reason.trim() || undefined,
    });

    setReason('');
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data do bloqueio
          </label>

          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            required
          >
            {availableDates.length === 0 ? (
              <option value="">Nenhuma data disponível</option>
            ) : (
              availableDates.map((item) => (
                <option key={item.dateKey} value={item.dateKey}>
                  {item.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'full-day' | 'time-range')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          >
            <option value="full-day">Dia inteiro</option>
            <option value="time-range">Intervalo de horário</option>
          </select>
        </div>
      </div>

      {type === 'time-range' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Início
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fim
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              required
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Motivo (opcional)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: consulta médica, folga parcial"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
        />
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={availableDates.length === 0}
        className="inline-flex items-center justify-center w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Adicionar bloqueio
      </button>
    </div>
  );
};

export default ScheduleBlockForm;