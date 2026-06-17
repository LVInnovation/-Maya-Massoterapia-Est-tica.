interface FooterProps {
  siteName: string;
  footerDescription: string;
  contactEmail: string;
  contactPhone: string;
}

const Footer = ({
  siteName,
  footerDescription,
  contactEmail,
  contactPhone,
}: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#060606] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-serif font-bold text-pink-300 mb-4">
              {siteName}
            </h3>

            <p className="text-[#c8c2a4] text-sm leading-relaxed">
              {footerDescription}
            </p>
          </div>

          <div>
            <h4 className="text-[#f4ecd6] font-semibold mb-4">
              Links Rápidos
            </h4>

            <ul className="space-y-2">
              <li>
                <a
                  href="#home"
                  className="text-[#c8c2a4] hover:text-pink-300 text-sm transition-colors"
                >
                  Início
                </a>
              </li>

              <li>
                <a
                  href="#professionals"
                  className="text-[#c8c2a4] hover:text-pink-300 text-sm transition-colors"
                >
                  Profissionais
                </a>
              </li>

              <li>
                <a
                  href="#services"
                  className="text-[#c8c2a4] hover:text-pink-300 text-sm transition-colors"
                >
                  Serviços
                </a>
              </li>

              <li>
                <a
                  href="#booking"
                  className="text-[#c8c2a4] hover:text-pink-300 text-sm transition-colors"
                >
                  Agendamento
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#f4ecd6] font-semibold mb-4">
              Contato
            </h4>

            <ul className="space-y-2 text-sm text-[#c8c2a4]">
              <li className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-pink-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>

                {contactEmail}
              </li>

              <li className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-pink-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>

                {contactPhone}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2c2c2c] mt-8 pt-8">
          <p className="text-center text-[#999a89] text-sm">
            © {currentYear} {siteName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;