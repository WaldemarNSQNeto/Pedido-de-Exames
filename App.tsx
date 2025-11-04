import React, { useState } from 'react';
import { FormData, RequestDetails } from './types.ts';
import Form from './components/Form.tsx';
import Preview from './components/Preview.tsx';
import Toast from './components/Toast.tsx';
import AdditionalRequestForm from './components/AdditionalRequestForm.tsx';

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

    const emptyRequestDetails: RequestDetails = {
        requestedExams: '',
        clinicalIndication: '',
        requestDate: getTodayDate(),
    };

    const [formData, setFormData] = useState<FormData>(emptyFormData);
    const [additionalRequests, setAdditionalRequests] = useState<RequestDetails[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; key: number } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, key: Date.now() });
    };
    
    const handleAddRequest = () => {
        setAdditionalRequests(prev => [...prev, { ...emptyRequestDetails }]);
        showToast(`Pedido ${additionalRequests.length + 2} adicionado!`);
    };

    const handleDuplicateRequest = (requestToDuplicate: RequestDetails) => {
        setAdditionalRequests(prev => [...prev, { ...requestToDuplicate }]);
        showToast('Pedido duplicado com sucesso!');
    };

    const handleRemoveRequest = (index: number) => {
        setAdditionalRequests(prev => prev.filter((_, i) => i !== index));
        showToast(`Pedido ${index + 2} removido.`, 'error');
    };

    const handleAdditionalRequestChange = (index: number, updatedDetails: RequestDetails) => {
        setAdditionalRequests(prev => 
            prev.map((item, i) => (i === index ? updatedDetails : item))
        );
    };

    const handlePrint = (): void => {
        const printContainerEl = document.getElementById('printable-container');
        const printStylesTemplate = document.getElementById('print-styles-template') as HTMLTemplateElement;

        if (!printContainerEl || !printStylesTemplate) {
            console.error('Elemento para impressão ou template de estilos não encontrados.');
            alert('Ocorreu um erro ao tentar preparar a impressão. Por favor, recarregue a página.');
            return;
        }

        const printWindow = window.open('', '_blank', 'height=800,width=1200,menubar=no,toolbar=no,location=no,status=no');

        if (printWindow) {
            printWindow.document.write(`
            <html>
                <head>
                <title>Imprimir Pedidos</title>
                <script src="https://cdn.tailwindcss.com"></script>
                ${printStylesTemplate.innerHTML}
                </head>
                <body>
                ${printContainerEl.outerHTML}
                </body>
            </html>
            `);

            printWindow.document.close();
            
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };
        }
    };

    const handleClearForm = (): void => {
        setFormData(emptyFormData);
        setAdditionalRequests([]);
        showToast('Formulário limpo com sucesso!');
    };
    
    return (
        <div className="text-gray-900 min-h-screen font-sans antialiased flex flex-col">
            {toast && (
                <Toast
                    key={toast.key}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="flex-grow">
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
                        <Form 
                            formData={formData} 
                            setFormData={setFormData} 
                            showToast={showToast} 
                            onDuplicate={handleDuplicateRequest}
                        />

                        {additionalRequests.map((requestData, index) => (
                            <AdditionalRequestForm
                                key={index}
                                index={index}
                                data={requestData}
                                onChange={handleAdditionalRequestChange}
                                onRemove={handleRemoveRequest}
                                onDuplicate={handleDuplicateRequest}
                                showToast={showToast}
                            />
                        ))}

                        <div className="p-4 mt-6 border-t border-gray-200 space-y-4">
                            <button
                                type="button"
                                onClick={handleAddRequest}
                                className="w-full bg-green-100 hover:bg-green-200 text-green-800 font-bold py-3 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Adicionar Novo Pedido
                            </button>
                        
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePrint}
                                    className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Imprimir Pedidos
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
                    </main>
                </div>
            </div>

            <footer className="site-footer">
                <hr className="footer-divider" />
                <p>
                    ⚕️ Asklépios Soluções Médicas ⚕️<br />
                    Startup by Waldemar Neto - Interno Turma LXIX<br />
                    V. Alfa 1.2. (02/11/2025)
                </p>
            </footer>

            {/* Container de pré-visualização para impressão (invisível) */}
            <div style={{ display: 'none' }}>
                <Preview 
                    formData={formData} 
                    additionalRequests={additionalRequests}
                />
            </div>
        </div>
    );
};

export default App;