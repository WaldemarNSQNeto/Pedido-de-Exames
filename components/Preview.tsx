import React from 'react';
import { FormData, RequestDetails } from '../types.ts';

interface PreviewProps {
  formData: FormData;
  showSecondCopy: boolean;
  isSecondRequestActive: boolean;
  secondRequestData: RequestDetails;
}

const DocumentColumn: React.FC<{ formData: FormData }> = ({ formData }) => {
    return (
        <div className="flex flex-col border border-black p-2 h-full leading-tight font-sans">
            <header className="border-b border-black mb-2 flex justify-center items-center" style={{ minHeight: '4.5rem' }}>
                <div className="h-12 flex justify-center items-center overflow-hidden">
                    <img 
                        src="https://boletim.hc.ufg.br/imagem/LogoEbserhTrans.png" 
                        alt="Logo Ebserh" 
                        style={{ height: '170%', transform: 'translateY(-5%)' }}
                    />
                </div>
            </header>

            <h1 className="text-center font-bold text-lg my-2">PEDIDO DE EXAMES</h1>

            <section className="pb-1 text-sm">
                <div className="flex items-end">
                    <span className="font-bold">Nome do paciente:</span>
                    <span className={`flex-1 ml-1 min-h-[1em] ${!formData.patientName ? 'border-b border-black' : ''}`}>{formData.patientName || ' '}</span>
                </div>
                <div className="flex items-end mt-1">
                    <span className="font-bold">Data de nascimento:</span>
                    {formData.dob ? (
                      <span className="ml-1 min-h-[1em]">{formData.dob}</span>
                    ) : (
                      <span className="ml-1 min-h-[1em]">___ /___ /_______</span>
                    )}
                    <span className="font-bold ml-4">Nome da mãe:</span>
                    <span className={`flex-1 ml-1 min-h-[1em] ${!formData.motherName ? 'border-b border-black' : ''}`}>{formData.motherName || ' '}</span>
                </div>
                <div className="flex items-end mt-1">
                    <span className="font-bold mr-1">Sexo:</span>
                    <span>( {formData.sex === 'Masculino' ? <span className="font-bold">X</span> : ' '} ) Masculino</span>
                    <span className="ml-4">( {formData.sex === 'Feminino' ? <span className="font-bold">X</span> : ' '} ) Feminino</span>
                </div>
            </section>
            
            <section className="mt-2 mb-4 text-center grid grid-cols-3 border-t border-l border-black text-sm">
                <div className="font-bold bg-gray-200 p-1 flex items-center justify-center border-b border-r border-black">Prontuário ou Nº de Atendimento</div>
                <div className="font-bold bg-gray-200 p-1 flex items-center justify-center border-b border-r border-black">Setor de Origem</div>
                <div className="font-bold bg-gray-200 p-1 flex items-center justify-center border-b border-r border-black">Nº do Leito de <br /> Internação</div>
                <div className="min-h-[2em] p-1 flex items-center justify-center border-b border-r border-black">{formData.recordNumber || ' '}</div>
                <div className="min-h-[2em] p-1 flex items-center justify-center border-b border-r border-black">{formData.originSector || ' '}</div>
                <div className="min-h-[2em] p-1 flex items-center justify-center border-b border-r border-black">{formData.bedNumber || ' '}</div>
            </section>

            <section className="flex-grow text-sm">
                <h2 className="font-bold">Exames Solicitados:</h2>
                <div className="min-h-[12em] p-1">
                    {formData.requestedExams && formData.requestedExams.trim() !== '' ? (
                        formData.requestedExams
                            .split('\n')
                            .filter(line => line.trim() !== '')
                            .map((line, index) => (
                                <div key={index}>
                                    <span className="font-bold">{`${index + 1}. `}</span>{line.trim()}
                                </div>
                            ))
                    ) : (
                        ' '
                    )}
                </div>
            </section>

            <section className="text-sm mt-2 mb-2">
                <div className="flex items-baseline">
                    <span className="font-bold">Indicação Clínica:</span>
                    <span className={`flex-1 ml-1 min-h-[1em] whitespace-pre-wrap break-words ${!formData.clinicalIndication ? 'border-b border-black' : ''}`}>{formData.clinicalIndication || ' '}</span>
                </div>
                <div className="flex items-end mt-2">
                    <span className="font-bold">Data da Solicitação:</span>
                    {formData.requestDate ? (
                      <span className="ml-1 min-h-[1em]">{formData.requestDate}</span>
                    ) : (
                      <span className="ml-1 min-h-[1em]">___ /___ /_______</span>
                    )}
                </div>
            </section>

            <footer className="text-[8px] mt-auto border-t border-black pt-1">
                <p className="text-center">Rua 235 QD. 68 Lote Área, Nº 285, s/nº - Setor Leste Universitário, Goiânia - GO, 74605-050</p>
            </footer>
        </div>
    );
};


const Preview: React.FC<PreviewProps> = ({ formData, showSecondCopy, isSecondRequestActive, secondRequestData }) => {
  
  const secondRequestFormData: FormData = {
      ...formData,
      ...secondRequestData,
  };

  return (
    <div id="printable-area" className="bg-white text-black p-4 mx-auto w-full max-w-[297mm] aspect-[297/210] shadow-2xl">
        <div className="flex justify-start items-stretch gap-4 h-full">
            <div className="w-[calc(50%-0.5rem)] h-full">
                <DocumentColumn formData={formData} />
            </div>
            
            {isSecondRequestActive && (
                 <div className="w-[calc(50%-0.5rem)] h-full">
                    <DocumentColumn formData={secondRequestFormData} />
                </div>
            )}

            {!isSecondRequestActive && showSecondCopy && (
                <div className="w-[calc(50%-0.5rem)] h-full">
                    <DocumentColumn formData={formData} />
                </div>
            )}
        </div>
    </div>
  );
};

export default Preview;