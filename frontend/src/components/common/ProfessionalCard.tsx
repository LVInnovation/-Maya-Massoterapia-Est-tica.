interface Professional {
  id: number;
  name: string;
  specialty: string;
  image: string;
}

interface ProfessionalCardProps {
  professional: Professional;
  onViewSchedule: (professionalId: number) => void;
}

const ProfessionalCard = ({
  professional,
  onViewSchedule,
}: ProfessionalCardProps) => {
  const defaultImage =
    'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=500&fit=crop';

  return (
    <div className="group overflow-hidden rounded-2xl bg-[#111111] shadow-xl transition-all duration-300 hover:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#161616] sm:h-56 md:h-64">
        <img
          src={professional.image || defaultImage}
          alt={professional.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-100" />
      </div>

      <div className="p-4 text-center sm:p-5 md:p-6">
        <h3 className="mb-1 text-lg font-semibold text-white sm:text-xl">
          {professional.name}
        </h3>

        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-pink-300 sm:mb-4 sm:text-sm">
          {professional.specialty}
        </p>

        <button
          type="button"
          onClick={() => onViewSchedule(professional.id)}
          className="inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-2 text-xs font-medium text-black transition-colors duration-200 hover:bg-pink-400 sm:px-5 sm:text-sm"
        >
          Ver agenda
        </button>
      </div>
    </div>
  );
};

export default ProfessionalCard;