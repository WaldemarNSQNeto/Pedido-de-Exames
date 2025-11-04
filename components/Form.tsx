import React, { useState, useEffect, useRef } from 'react';
import { FormData, RequestDetails } from '../types.ts';
import { GoogleGenAI, Type } from '@google/genai';

interface FormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onDuplicate: (details: RequestDetails) => void;
}

const parseExams = (text: string): string[] => {
  if (!text.trim()) return [];
  // Substitui múltiplos delimitadores por uma nova linha
  const normalizedText = text.replace(/[,;.]/g, '\n');
  // Divide pela nova linha, remove espaços extras e filtra linhas vazias
  return normalizedText
    .split('\n')
    .map(exam => exam.trim())
    .filter(exam => exam !== '');
};

const examProfiles = {
    'Perfil Básico': [
        'Hemograma completo',
        'Glicemia de jejum',
        'Ureia',
        'Creatinina',
        'Colesterol total e frações',
        'Triglicerídeos'
    ],
    'Função Hepática': [
        'TGO (AST)',
        'TGP (ALT)',
        'Fosfatase Alcalina',
        'Gama-GT',
        'Bilirrubinas (Total, Direta e Indireta)'
    ],
    'Função Renal': [
        'Ureia',
        'Creatinina',
        'Sódio',
        'Potássio',
        'Exame de urina tipo I (EAS)'
    ],
    'Urina I': [
        'Exame de urina tipo I (EAS)',
        'Cultura c/ Antibiograma'
    ]
};

const Form: React.FC<FormProps> = ({ formData, setFormData, showToast, onDuplicate }) => {
  const [examLimitError, setExamLimitError] = useState(false);
  const [charLimit, setCharLimit] = useState<number | null>(null);
  const [clinicalContext, setClinicalContext] = useState('');
  const [suggestedExams, setSuggestedExams] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isAiSectionVisible, setIsAiSectionVisible] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  const requestedExamsRef = useRef<HTMLTextAreaElement>(null);
  const clinicalIndicationRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const parsedExams = parseExams(formData.requestedExams);
    const filledLinesCount = parsedExams.length;

    setExamLimitError(filledLinesCount > 15);

    let limit: number | null = null;
    if (filledLinesCount >= 9 && filledLinesCount <= 15) {
      limit = 48 * (16 - filledLinesCount);
    }
    setCharLimit(limit);

    if (limit !== null && formData.clinicalIndication.length > limit) {
      setFormData(prev => ({
        ...prev,
        clinicalIndication: prev.clinicalIndication.slice(0, limit),
      }));
    }
  }, [formData.requestedExams, formData.clinicalIndication.length, setFormData]);
  
  useEffect(() => {
    if (requestedExamsRef.current) {
        requestedExamsRef.current.style.height = 'auto';
        requestedExamsRef.current.style.height = `${requestedExamsRef.current.scrollHeight}px`;
    }
  }, [formData.requestedExams]);

  useEffect(() => {
    if (clinicalIndicationRef.current) {
        clinicalIndicationRef.current.style.height = 'auto';
        clinicalIndicationRef.current.style.height = `${clinicalIndicationRef.current.scrollHeight}px`;
    }
  }, [formData.clinicalIndication]);


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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    if (name === 'patientName' && value.length > 48) {
        value = value.slice(0, 48);
    }
    if (name === 'motherName' && value.length > 52) {
        value = value.slice(0, 52);
    }
    if (name === 'recordNumber' && value.length > 38) {
        value = value.slice(0, 38);
    }
    if (name === 'originSector' && value.length > 38) {
        value = value.slice(0, 38);
    }
    if (name === 'bedNumber' && value.length > 38) {
        value = value.slice(0, 38);
    }

    if (name === 'requestedExams') {
        if (parseExams(value).length > 15) {
            setExamLimitError(true);
            showToast('Limite de 15 exames atingido.', 'error');
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
    
    if (name === 'dob' || name === 'requestDate') {
      const formattedValue = formatDate(value);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value as FormData['sex'] }));
  };

  const addExams = (examsToAdd: string[]) => {
    setFormData(prev => {
        const existingExams = parseExams(prev.requestedExams);
        const newExams = examsToAdd.filter(exam => !existingExams.includes(exam.trim()));
        const combinedExams = [...existingExams, ...newExams];

        if (combinedExams.length > 15) {
            setExamLimitError(true);
            showToast('Limite de 15 exames atingido.', 'error');
            const examsWithinLimit = combinedExams.slice(0, 15).join('\n');
            return { ...prev, requestedExams: examsWithinLimit };
        }
        
        setExamLimitError(false);
        return { ...prev, requestedExams: combinedExams.join('\n') };
    });
  };
  
  const handleProfileClick = (profileName: keyof typeof examProfiles) => {
    addExams(examProfiles[profileName]);
    showToast(`✅ ${profileName} adicionado!`);
  };

  const addSuggestedExam = (exam: string) => {
    addExams([exam]);
    showToast(`✅ ${exam} adicionado!`);
  };

  const handleSuggestExams = async () => {
    if (!clinicalContext.trim()) {
        setAiError("Por favor, descreva o quadro clínico.");
        return;
    }
    setIsLoadingAI(true);
    setAiError('');
    setSuggestedExams([]);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const { dob, sex } = formData;

        // Calcula a idade a partir da data de nascimento
        let age = 'Idade não informada';
        if (dob && /^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
            const [day, month, year] = dob.split('/').map(Number);
            const birthDate = new Date(year, month - 1, day);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            age = `${calculatedAge} anos`;
        }

        const sexInfo = sex || 'Sexo não informado';
        
        const prompt = `Baseado no seguinte quadro clínico para um paciente de ${age} do sexo ${sexInfo}: "${clinicalContext}", sugira uma lista de exames laboratoriais e de imagem relevantes. Foco em exames comuns e essenciais. Retorne um array JSON de strings com os nomes dos exames. Exemplo: ["Hemograma completo", "Radiografia de Tórax PA e Perfil"]`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });
        
        const resultText = response.text.trim();
        const suggestions = JSON.parse(resultText);
        setSuggestedExams(suggestions);
    } catch (error) {
        console.error("Erro ao sugerir exames:", error);
        setAiError("Não foi possível obter sugestões. Verifique a conexão ou tente novamente.");
    } finally {
        setIsLoadingAI(false);
    }
  };

  const handleAcceptDisclaimer = () => {
    setShowDisclaimerModal(false);
    setIsAiSectionVisible(true);
  };

  const handleDuplicateClick = () => {
    onDuplicate({
      requestedExams: formData.requestedExams,
      clinicalIndication: formData.clinicalIndication,
      requestDate: formData.requestDate
    });
  };

  return (
    <>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold text-black border-b border-gray-300 pb-1 mb-2">Informações do Paciente</h2>
        
        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">Nome do paciente:</label>
          <input type="text" name="patientName" id="patientName" value={formData.patientName} onChange={handleChange} className="w-full bg-gray-100 border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={48} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento:</label>
            <input type="text" name="dob" id="dob" value={formData.dob} onChange={handleChange} placeholder="DD/MM/AAAA" className="w-full bg-gray-100 border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="motherName" className="block text-sm font-medium text-gray-700 mb-1">Nome da mãe:</label>
            <input type="text" name="motherName" id="motherName" value={formData.motherName} onChange={handleChange} className="w-full bg-gray-100 border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={52} />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo:</label>
              <div className="flex items-center space-x-4 h-10">
                  <label className="flex items-center cursor-pointer">
                      <input type="radio" name="sex" value="Masculino" checked={formData.sex === 'Masculino'} onChange={handleRadioChange} className="form-radio h-4 w-4 text-blue-600" />
                      <span className="ml-2 text-sm">Masculino</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                      <input type="radio" name="sex" value="Feminino" checked={formData.sex === 'Feminino'} onChange={handleRadioChange} className="form-radio h-4 w-4 text-pink-600" />
                      <span className="ml-2 text-sm">Feminino</span>
                  </label>
              </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-black border-b border-gray-300 pb-1 mb-2 pt-4">Informações de Atendimento</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="recordNumber" className="block text-sm font-medium text-gray-700 mb-1">Prontuário/Atend.:</label>
              <div className="relative">
                <input type="text" name="recordNumber" id="recordNumber" value={formData.recordNumber} onChange={handleChange} className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={38} />
                <span className={`absolute inset-y-0 right-3 flex items-center text-xs pointer-events-none ${formData.recordNumber.length >= 38 ? 'font-bold text-red-500' : 'text-gray-500'}`}>
                    {formData.recordNumber.length}/38
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="originSector" className="block text-sm font-medium text-gray-700 mb-1">Setor de Origem:</label>
              <div className="relative">
                <input type="text" name="originSector" id="originSector" value={formData.originSector} onChange={handleChange} className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={38} />
                <span className={`absolute inset-y-0 right-3 flex items-center text-xs pointer-events-none ${formData.originSector.length >= 38 ? 'font-bold text-red-500' : 'text-gray-500'}`}>
                    {formData.originSector.length}/38
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="bedNumber" className="block text-sm font-medium text-gray-700 mb-1">Nº do Leito:</label>
              <div className="relative">
                <input type="text" name="bedNumber" id="bedNumber" value={formData.bedNumber} onChange={handleChange} className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={38} />
                <span className={`absolute inset-y-0 right-3 flex items-center text-xs pointer-events-none ${formData.bedNumber.length >= 38 ? 'font-bold text-red-500' : 'text-gray-500'}`}>
                    {formData.bedNumber.length}/38
                </span>
              </div>
            </div>
        </div>
        
        <div className="flex justify-between items-center border-b border-gray-300 mb-2 pt-4">
            <h2 className="text-xl font-semibold text-black pb-1">Detalhes da Solicitação</h2>
            <button
                type="button"
                onClick={handleDuplicateClick}
                className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                title="Duplicar este pedido"
            >
                Duplicar?
            </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adicionar Exames Comuns:</label>
          <div className="flex flex-wrap gap-2 mb-4">
              {(Object.keys(examProfiles) as Array<keyof typeof examProfiles>).map(profileName => (
                  <button
                      key={profileName}
                      type="button"
                      onClick={() => handleProfileClick(profileName)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-semibold rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                      {profileName}
                  </button>
              ))}
          </div>

          {!isAiSectionVisible && (
            <div className="my-4">
                <button
                    type="button"
                    onClick={() => setShowDisclaimerModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200 transition-colors"
                >
                    <span className="text-lg">✨</span>
                    Usar Assistente de IA para Sugerir Exames
                </button>
            </div>
          )}

          {isAiSectionVisible && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg my-4">
              <label htmlFor="clinicalContext" className="block text-sm font-medium text-gray-800 mb-1">Quadro Clínico para Sugestão de Exames (IA):</label>
              <textarea
                  name="clinicalContext"
                  id="clinicalContext"
                  placeholder="Ex: Paciente 65 anos, diabético, hipertenso, com dor torácica atípica há 2 dias..."
                  value={clinicalContext}
                  onChange={(e) => setClinicalContext(e.target.value)}
                  className="w-full bg-white border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
              />
              <button
                  type="button"
                  onClick={handleSuggestExams}
                  disabled={isLoadingAI}
                  className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                  {isLoadingAI ? 'Sugerindo...' : 'Sugerir Exames com IA'}
              </button>
              {aiError && <p className="text-red-600 text-xs mt-2">{aiError}</p>}
              {suggestedExams.length > 0 && (
                  <div className="mt-3">
                      <p className="text-sm font-medium text-gray-800 mb-2">Sugestões (clique para adicionar):</p>
                      <div className="flex flex-wrap gap-2">
                          {suggestedExams.map((exam, index) => (
                              <button
                                  key={index}
                                  type="button"
                                  onClick={() => addSuggestedExam(exam)}
                                  className="px-3 py-1 bg-green-200 text-green-900 text-xs font-semibold rounded-full hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                              >
                                  + {exam}
                              </button>
                          ))}
                      </div>
                  </div>
              )}
            </div>
          )}

          <label htmlFor="requestedExams" className="block text-sm font-medium text-gray-700 mb-1">Exames Solicitados (use Enter a cada novo exame):</label>
          <textarea 
              ref={requestedExamsRef}
              name="requestedExams" 
              id="requestedExams" 
              placeholder="Digite os exames aqui ou use os atalhos acima..."
              value={formData.requestedExams} 
              onChange={handleChange} 
              className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
              rows={4}
          />
          {examLimitError && <p className="text-red-500 text-xs mt-1">Limite de 15 exames atingido.</p>}
        </div>

        <div>
          <label htmlFor="clinicalIndication" className="block text-sm font-medium text-gray-700 mb-1">Indicação Clínica:</label>
          <textarea 
              ref={clinicalIndicationRef}
              name="clinicalIndication" 
              id="clinicalIndication" 
              value={formData.clinicalIndication} 
              onChange={handleChange} 
              className="w-full bg-gray-100 border-gray-300 rounded-md p-2 pb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
              rows={2}
          />
          {charLimit !== null && (
              <div className="text-xs text-gray-500 mt-1">
                  <p>O espaço é limitado para garantir a legibilidade do documento.</p>
                  <p className={formData.clinicalIndication.length >= charLimit ? 'font-bold text-red-500' : ''}>
                      Caracteres: {formData.clinicalIndication.length}/{charLimit}
                  </p>
              </div>
          )}
        </div>

        <div>
            <label htmlFor="requestDate" className="block text-sm font-medium text-gray-700 mb-1">Data da Solicitação:</label>
            <input type="text" name="requestDate" id="requestDate" value={formData.requestDate} onChange={handleChange} placeholder="DD/MM/AAAA" className="w-full bg-gray-100 border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
      </div>
      
      {showDisclaimerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold text-gray-900">Aviso Importante</h3>
                <p className="mt-2 text-sm text-gray-600">
                    Esta funcionalidade de sugestão de exames utiliza Inteligência Artificial e está em fase experimental. As sugestões são geradas automaticamente e podem não ser completas, precisas ou apropriadas para todas as situações clínicas.
                </p>
                <p className="mt-3 text-sm text-gray-600 font-semibold">
                    A responsabilidade final pela solicitação de exames é inteiramente do profissional de saúde.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={() => setShowDisclaimerModal(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={handleAcceptDisclaimer}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                        Entendi e desejo continuar
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Form;