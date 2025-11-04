import React, { useState, useEffect, useRef } from 'react';
import { FormData, RequestDetails } from './types.ts';
import Form from './components/Form.tsx';
import Preview from './components/Preview.tsx';

const formatDate = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    return formatted;
};

const App: React.FC = () => {
    const getTodayDate = (): string => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}/${month}/${year}`;
    };
    
    const emptyFormData: FormData = {
        patientName: '',
        dob: '',
        sex: '',
        motherName: '',
        recordNumber: '',
        originSector: '',
        bedNumber: '',
        requestedExams: '',
        clinicalIndication: '',
        requestDate: getTodayDate(),
    };

    const emptySecondRequestData: RequestDetails = {
        requestedExams: '',
        clinicalIndication: '',
        requestDate: getTodayDate(),
    };

    const [formData, setFormData] = useState<FormData>(emptyFormData);
    const [secondRequestData, setSecondRequestData] = useState<RequestDetails>(emptySecondRequestData);
    const [showSecondCopy, setShowSecondCopy] = useState<boolean>(false);
    const [isSecondRequestActive, setIsSecondRequestActive] = useState<boolean>(false);
    const [secondExamLimitError, setSecondExamLimitError] = useState(false);
    const [secondCharLimit, setSecondCharLimit] = useState<number | null>(null);

    const requestedExams2Ref = useRef<HTMLTextAreaElement>(null);
    const clinicalIndication2Ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isSecondRequestActive) {
            setShowSecondCopy(false);
        }
    }, [isSecondRequestActive]);
    
    useEffect(() => {
        const examLines = secondRequestData.requestedExams.split('\n');
        const examLinesCount = examLines.length;
        const filledLinesCount = examLines.filter(line => line.trim() !== '').length;
        
        setSecondExamLimitError(examLinesCount > 15);

        let limit: number | null = null;
        if (filledLinesCount >= 9 && filledLinesCount <= 15) {
          limit = 48 * (16 - filledLinesCount);
        }
        setSecondCharLimit(limit);

        if (limit !== null && secondRequestData.clinicalIndication.length > limit) {
          setSecondRequestData(prev => ({
            ...prev,
            clinicalIndication: prev.clinicalIndication.slice(0, limit),
          }));
        }
    }, [secondRequestData.requestedExams, secondRequestData.clinicalIndication.length]);

    useEffect(() => {
        if (requestedExams2Ref.current) {
            requestedExams2Ref.current.style.height = 'auto';
            requestedExams2Ref.current.style.height = `${requestedExams2Ref.current.scrollHeight}px`;
        }
    }, [secondRequestData.requestedExams]);

    useEffect(() => {
        if (clinicalIndication2Ref.current) {
            clinicalIndication2Ref.current.style.height = 'auto';
            clinicalIndication2Ref.current.style.height = `${clinicalIndication2Ref.current.scrollHeight}px`;
        }
    }, [secondRequestData.clinicalIndication]);


    const handlePrint = (): void => {
        const printContentEl = document.getElementById('printable-area');
        const printStylesTemplate = document.getElementById('print-styles-template') as HTMLTemplateElement;

        if (!printContentEl || !printStylesTemplate) {
            console.error('Elemento para impressão ou template de estilos não encontrados.');
            alert('Ocorreu um erro ao tentar preparar a impressão. Por favor, recarregue a página.');
            return;
        }

        const printWindow = window.open('', '_blank', 'height=800,width=1200,menubar=no,toolbar=no,location=no,status=no');

        if (printWindow) {
            printWindow.document.write(`
            <html>
                <head>
                <title>Imprimir Pedido</title>
                <script src="https://cdn.tailwindcss.com"></script>
                ${printStylesTemplate.innerHTML}
                </head>
                <body>
                ${printContentEl.outerHTML}
                </body>
            </html>
            `);

            printWindow.document.close();
            
            // Espera o conteúdo (incluindo o Tailwind CDN) carregar na nova janela
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };
        }
    };

    const handleClearForm = (): void => {
        setFormData(emptyFormData);
        setSecondRequestData(emptySecondRequestData);
        setIsSecondRequestActive(false);
        setShowSecondCopy(false);
    };
    
    const handleSecondRequestChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        let { name, value } = e.target;

        if (name === 'requestedExams') {
            if (value.split('\n').length > 15) {
                setSecondExamLimitError(true);
                return;
            }
            setSecondExamLimitError(false);
        }

        if (name === 'clinicalIndication') {
            value = value.replace(/(\r\n|\n|\r)/gm, " ");
            if (secondCharLimit !== null && value.length > secondCharLimit) {
                return;
            }
        }

        if (name === 'requestDate') {
          const formattedValue = formatDate(value);
          setSecondRequestData(prev => ({...prev, [name]: formattedValue}));
        } else {
          setSecondRequestData(prev => ({...prev, [name]: value}));
        }
    }

    return (
        <div className="text-gray-900 min-h-screen font-sans antialiased">
            <header>
                <div className="main-title-container">
                    <img src="/The-Rod-of-Asclepius2-V2.png" alt="Cajado de Asclépio" className="header-icon" />
                    <hr className="header-divider" />            
                    <h1 className="text-3xl font-bold my-2">Solicitação de Pedido de Exames</h1>
                    <hr className="header-divider" />            
                </div>
            </header>

            <div id="app-container">
                <main>
                    <div className="w-full">
                        <div className="sticky top-4">
                            <Form formData={formData} setFormData={setFormData} />

                            {isSecondRequestActive && (
                                <div className="p-6 space-y-4 mt-6">
                                    <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-4">2º Pedido - Detalhes da Solicitação</h2>
                                    <div>
                                        <label htmlFor="requestedExams2" className="block text-sm font-medium text-gray-700 mb-1">Exames Solicitados:</label>
                                        <textarea 
                                            ref={requestedExams2Ref}
                                            name="requestedExams" 
                                            id="requestedExams2" 
                                            value={secondRequestData.requestedExams} 
                                            onChange={handleSecondRequestChange} 
                                            className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                                            style={{ minHeight: '6rem' }}
                                        />
                                        {secondExamLimitError && <p className="text-red-500 text-xs mt-1">Limite de 15 exames atingido.</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="clinicalIndication2" className="block text-sm font-medium text-gray-700 mb-1">Indicação Clínica:</label>
                                        <textarea 
                                            ref={clinicalIndication2Ref}
                                            name="clinicalIndication" 
                                            id="clinicalIndication2" 
                                            value={secondRequestData.clinicalIndication} 
                                            onChange={handleSecondRequestChange} 
                                            className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                                            style={{ minHeight: '4.5rem' }}
                                        />
                                        {secondCharLimit !== null && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                <p>O espaço é limitado para garantir a legibilidade do documento.</p>
                                                <p className={secondRequestData.clinicalIndication.length >= secondCharLimit ? 'font-bold text-red-500' : ''}>
                                                    Caracteres: {secondRequestData.clinicalIndication.length}/{secondCharLimit}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="requestDate2" className="block text-sm font-medium text-gray-700 mb-1">Data da Solicitação:</label>
                                        <input type="text" name="requestDate" id="requestDate2" value={secondRequestData.requestDate} onChange={handleSecondRequestChange} placeholder="DD/MM/AAAA" className="w-full bg-gray-100 border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            )}

                            <div className="p-4 mt-6 space-y-3">
                                <label htmlFor="second-request-checkbox" className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        id="second-request-checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        checked={isSecondRequestActive}
                                        onChange={() => setIsSecondRequestActive(!isSecondRequestActive)}
                                    />
                                    <span className="ml-3 font-medium text-gray-700">Adicionar 2º Pedido (diferente)</span>
                                </label>

                                <label htmlFor="two-copies-checkbox" className={`flex items-center transition-opacity ${isSecondRequestActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input 
                                        type="checkbox" 
                                        id="two-copies-checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={showSecondCopy}
                                        onChange={() => setShowSecondCopy(!showSecondCopy)}
                                        disabled={isSecondRequestActive}
                                    />
                                    <span className="ml-3 font-medium text-gray-700">Imprimir em duas vias (idênticas)</span>
                                </label>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-6">
                                <button
                                    onClick={handlePrint}
                                    className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Imprimir Pedido
                                </button>
                                <button
                                    onClick={handleClearForm}
                                    title="Limpar Formulário"
                                    aria-label="Limpar Formulário"
                                    className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold p-3 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>


            {/* Hidden Preview for printing functionality */}
            <div className="hidden">
                <Preview 
                    formData={formData} 
                    showSecondCopy={showSecondCopy}
                    isSecondRequestActive={isSecondRequestActive}
                    secondRequestData={secondRequestData}
                />
            </div>
        </div>
    );
};

export default App;