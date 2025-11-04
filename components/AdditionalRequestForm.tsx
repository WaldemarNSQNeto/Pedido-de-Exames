import React, { useState, useEffect, useRef } from 'react';
import { RequestDetails } from '../types.ts';

interface AdditionalRequestFormProps {
    index: number;
    data: RequestDetails;
    onChange: (index: number, data: RequestDetails) => void;
    onRemove: (index: number) => void;
    onDuplicate: (details: RequestDetails) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const parseExams = (text: string): string[] => {
  if (!text.trim()) return [];
  const normalizedText = text.replace(/[,;.]/g, '\n');
  return normalizedText
    .split('\n')
    .map(exam => exam.trim())
    .filter(exam => exam !== '');
};

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

const AdditionalRequestForm: React.FC<AdditionalRequestFormProps> = ({ index, data, onChange, onRemove, onDuplicate, showToast }) => {
    const [examLimitError, setExamLimitError] = useState(false);
    const [charLimit, setCharLimit] = useState<number | null>(null);

    const requestedExamsRef = useRef<HTMLTextAreaElement>(null);
    const clinicalIndicationRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        const parsedExamsList = parseExams(data.requestedExams);
        const filledLinesCount = parsedExamsList.length;
        
        setExamLimitError(filledLinesCount > 15);

        let limit: number | null = null;
        if (filledLinesCount >= 9 && filledLinesCount <= 15) {
          limit = 48 * (16 - filledLinesCount);
        }
        setCharLimit(limit);

        if (limit !== null && data.clinicalIndication.length > limit) {
          handleChange({
            target: {
                name: 'clinicalIndication',
                value: data.clinicalIndication.slice(0, limit),
            }
          } as React.ChangeEvent<HTMLTextAreaElement>);
        }
    }, [data.requestedExams, data.clinicalIndication.length]);

    useEffect(() => {
        if (requestedExamsRef.current) {
            requestedExamsRef.current.style.height = 'auto';
            requestedExamsRef.current.style.height = `${requestedExamsRef.current.scrollHeight}px`;
        }
    }, [data.requestedExams]);

    useEffect(() => {
        if (clinicalIndicationRef.current) {
            clinicalIndicationRef.current.style.height = 'auto';
            clinicalIndicationRef.current.style.height = `${clinicalIndicationRef.current.scrollHeight}px`;
        }
    }, [data.clinicalIndication]);


    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        let { name, value } = e.target;

        if (name === 'requestedExams') {
            if (parseExams(value).length > 15) {
                setExamLimitError(true);
                showToast(`Limite de 15 exames atingido no Pedido ${index + 2}.`, 'error');
                return;
            }
            setExamLimitError(false);
        }

        if (name === 'clinicalIndication') {
            value = value.replace(/(\r\n|\n|\r)/gm, " ");
            if (charLimit !== null && value.length > charLimit) {
                return;
            }
        }

        const updatedValue = (name === 'requestDate') ? formatDate(value) : value;
        onChange(index, { ...data, [name]: updatedValue });
    };


    return (
        <div className="p-6 space-y-4 mt-6 border-t-2 border-dashed relative">
            <button
                type="button"
                onClick={() => onRemove(index)}
                title="Remover Pedido"
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            <div className="flex justify-between items-center border-b border-gray-300 mb-2">
                <h2 className="text-xl font-semibold text-black pb-1">
                    {index + 2}º Pedido - Detalhes da Solicitação
                </h2>
                <button
                    type="button"
                    onClick={() => onDuplicate(data)}
                    className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    title="Duplicar este pedido"
                >
                    Duplicar?
                </button>
            </div>
            
            <div>
                <label htmlFor={`requestedExams${index}`} className="block text-sm font-medium text-gray-700 mb-1">Exames Solicitados:</label>
                <textarea 
                    ref={requestedExamsRef}
                    name="requestedExams" 
                    id={`requestedExams${index}`}
                    value={data.requestedExams} 
                    onChange={handleChange} 
                    className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                    rows={4}
                    placeholder="Digite os exames aqui..."
                />
                {examLimitError && <p className="text-red-500 text-xs mt-1">Limite de 15 exames atingido.</p>}
            </div>
            <div>
                <label htmlFor={`clinicalIndication${index}`} className="block text-sm font-medium text-gray-700 mb-1">Indicação Clínica:</label>
                <textarea 
                    ref={clinicalIndicationRef}
                    name="clinicalIndication" 
                    id={`clinicalIndication${index}`}
                    value={data.clinicalIndication} 
                    onChange={handleChange} 
                    className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                    rows={2}
                />
                {charLimit !== null && (
                    <div className="text-xs text-gray-500 mt-1">
                        <p>O espaço é limitado para garantir a legibilidade do documento.</p>
                        <p className={data.clinicalIndication.length >= charLimit ? 'font-bold text-red-500' : ''}>
                            Caracteres: {data.clinicalIndication.length}/{charLimit}
                        </p>
                    </div>
                )}
            </div>
            <div>
                <label htmlFor={`requestDate${index}`} className="block text-sm font-medium text-gray-700 mb-1">Data da Solicitação:</label>
                <input 
                    type="text" 
                    name="requestDate" 
                    id={`requestDate${index}`}
                    value={data.requestDate} 
                    onChange={handleChange} 
                    placeholder="DD/MM/AAAA" 
                    className="w-full bg-gray-100 border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
            </div>
        </div>
    );
};

export default AdditionalRequestForm;