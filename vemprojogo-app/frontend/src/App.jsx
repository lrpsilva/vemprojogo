import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Plus, LogOut, User, Image, Trash2, Clock, Zap } from 'lucide-react';
import axios from 'axios';
import logo from './assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configurar axios para incluir token em todas as requisições
const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Função para formatar data de forma robusta
const formatarData = (dataString, opcoes = {}) => {
  try {
    if (!dataString) return 'Data inválida';
    
    // Se for uma string de data YYYY-MM-DD, parsear corretamente
    let data;
    if (typeof dataString === 'string' && dataString.includes('-')) {
      const [ano, mes, dia] = dataString.split('-');
      data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    } else {
      data = new Date(dataString);
    }
    
    if (isNaN(data.getTime())) return 'Data inválida';
    
    const opcoesPadrao = {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    
    return data.toLocaleDateString('pt-BR', { ...opcoesPadrao, ...opcoes });
  } catch (error) {
    console.error('Erro ao formatar data:', error, dataString);
    return 'Data inválida';
  }
};

// Função para formatar horário sem segundos
const formatarHorario = (horarioString) => {
  try {
    if (!horarioString) return 'Hora inválida';
    
    // Se tiver segundos (HH:MM:SS), pega apenas HH:MM
    if (horarioString.includes(':')) {
      const partes = horarioString.split(':');
      return `${partes[0]}:${partes[1]}`;
    }
    return horarioString;
  } catch (error) {
    console.error('Erro ao formatar horário:', error, horarioString);
    return horarioString;
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('login');
  const [aulas, setAulas] = useState([]);
  const [arenas, setArenas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aulasLoaded, setAulasLoaded] = useState(false);
  const [arenasLoaded, setArenasLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadProfile();
    }
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setProfile(response.data);
      setUser({ id: response.data.id });
      setView('aulas');
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      localStorage.removeItem('token');
    }
  };

  const loadAulas = async () => {
    try {
      const response = await api.get('/aulas');
      setAulas(response.data);
      setAulasLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    }
  };

  const loadArenas = async () => {
    try {
      const response = await api.get('/arenas');
      setArenas(response.data);
      setArenasLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar arenas:', error);
    }
  };

  const Login = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [lembrarMe, setLembrarMe] = useState(false);

    useEffect(() => {
      // Carregar dados salvos do localStorage ao montar o componente
      const emailSalvo = localStorage.getItem('vemprojogo_email');
      const senhaSalva = localStorage.getItem('vemprojogo_senha');
      if (emailSalvo && senhaSalva) {
        setEmail(emailSalvo);
        setSenha(senhaSalva);
        setLembrarMe(true);
      }
    }, []);

    const handleSubmit = async () => {
      setLoading(true);
      setError('');
      
      try {
        const endpoint = isSignUp ? '/auth/register' : '/auth/login';
        const payload = isSignUp 
          ? { email, password: senha, nome: 'Novo Usuário', arena: 'Arena Principal', cidade: 'Sua Cidade' }
          : { email, password: senha };

        const response = await api.post(endpoint, payload);
        
        localStorage.setItem('token', response.data.token);
        
        // Salvar ou limpar credenciais baseado em 'lembrar-me'
        if (lembrarMe && !isSignUp) {
          localStorage.setItem('vemprojogo_email', email);
          localStorage.setItem('vemprojogo_senha', senha);
        } else {
          localStorage.removeItem('vemprojogo_email');
          localStorage.removeItem('vemprojogo_senha');
        }
        
        setUser(response.data.user);
        setProfile(response.data.user);
        
        if (isSignUp) {
          setView('perfil');
        } else {
          setView('aulas');
          // Não carregar aulas aqui, deixar o useEffect do componente Aulas fazer isso
        }
      } catch (error) {
        setError(error.response?.data?.error || 'Erro ao fazer login');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-600 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="bg-white bg-opacity-95 backdrop-blur rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white border-opacity-20 relative z-10">
          <div className="text-center mb-8">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                {/* Efeito de brilho animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
                {/* Card do ícone */}
                <div className="relative bg-white rounded-3xl p-6 shadow-2xl border-2 border-blue-100">
                  <img src={logo} alt="VemProJogo Logo" className="w-32 h-32 object-contain" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">VemProJogo</h1>
            <p className="text-gray-500 mt-2 font-medium">Organize suas aulas de futevôlei</p>
            <div className="flex items-center justify-center gap-1 mt-3 text-blue-600">
              <Zap size={16} className="fill-current" />
              <span className="text-xs font-semibold">Conecte jogadores e crie comunidades</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
              />
            </div>

            {!isSignUp && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lembrarMe"
                  checked={lembrarMe}
                  onChange={(e) => setLembrarMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="lembrarMe" className="text-sm font-medium text-gray-600 cursor-pointer select-none">
                  Lembrar meus dados
                </label>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline-offset-2 hover:underline transition"
            >
              {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Perfil = () => {
    const [nome, setNome] = useState('');
    const [arena, setArena] = useState('');
    const [cidade, setCidade] = useState('');
    const [nivel, setNivel] = useState('');
    const [instagram, setInstagram] = useState('');

    useEffect(() => {
      if (!arenasLoaded) {
        loadArenas();
      }
    }, []);

    const handlePhotoUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('photo', file);

        const response = await api.post('/auth/upload-photo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setProfile(response.data);
        setError('');
      } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
        setError('Erro ao fazer upload da foto');
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const response = await api.put('/auth/profile', { nome, arena, cidade, nivel, instagram });
        setProfile(response.data);
        setView('aulas');
        // Não carregar aulas aqui
      } catch (error) {
        setError('Erro ao atualizar perfil');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete seu Perfil</h2>
            
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {profile?.foto_url ? (
                      <img 
                        src={`http://localhost:3000${profile.foto_url}`} 
                        alt="Perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-gray-400" />
                    )}
                  </div>
                  <label 
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 cursor-pointer transition"
                  >
                    {loading ? (
                      <div className="animate-spin">⟳</div>
                    ) : (
                      <Image size={16} />
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome*</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arena (Local de Jogo)*</label>
                <select
                  value={arena}
                  onChange={(e) => setArena(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione uma arena</option>
                  {arenas.map(a => (
                    <option key={a.id} value={a.nome}>{a.nome} - {a.cidade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade*</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Rio de Janeiro"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nível</label>
                <select
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione um nível</option>
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Ex: @seu_instagram"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Aulas = () => {
    const [showNewAula, setShowNewAula] = useState(false);
    const [showNovaArena, setShowNovaArena] = useState(false);
    const [novaAula, setNovaAula] = useState({ data: '', horario: '', local: '' });
    const [novaArena, setNovaArena] = useState({ nome: '', cidade: '', descricao: '' });
    const [aulaDetalhes, setAulaDetalhes] = useState(null);
    const [showDetalhes, setShowDetalhes] = useState(false);
    const [participanteSelecionado, setParticipanteSelecionado] = useState(null);

    useEffect(() => {
      if (!aulasLoaded) {
        loadAulas();
      }
      if (!arenasLoaded) {
        loadArenas();
      }
    }, []);

    const verDetalhesAula = async (aulaId) => {
      try {
        const response = await api.get(`/aulas/${aulaId}`);
        setAulaDetalhes(response.data);
        setShowDetalhes(true);
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        alert('Erro ao carregar detalhes da aula');
      }
    };

    const confirmarPresenca = async (aulaId) => {
      try {
        await api.post('/presencas', { aula_id: aulaId });
        
        // Se está visualizando detalhes, atualizar apenas os detalhes
        if (showDetalhes && aulaDetalhes?.id === aulaId) {
          await verDetalhesAula(aulaId);
        } else {
          // Caso contrário, recarregar as aulas
          await loadAulas();
        }
      } catch (error) {
        alert(error.response?.data?.error || 'Erro ao confirmar presença');
      }
    };

    const cancelarPresenca = async (aulaId) => {
      try {
        await api.delete(`/presencas/${aulaId}`);
        
        // Se está visualizando detalhes, atualizar apenas os detalhes
        if (showDetalhes && aulaDetalhes?.id === aulaId) {
          await verDetalhesAula(aulaId);
        } else {
          // Caso contrário, recarregar as aulas
          await loadAulas();
        }
        
        alert('Presença cancelada!');
      } catch (error) {
        alert('Erro ao cancelar presença');
      }
    };

    const criarAula = async () => {
      if (!novaAula.data || !novaAula.horario || !novaAula.local) {
        alert('Preencha todos os campos!');
        return;
      }

      try {
        setLoading(true);
        await api.post('/aulas', {
          data: novaAula.data,
          horario: novaAula.horario,
          local: novaAula.local
        });
        
        setNovaAula({ data: '', horario: '', local: '' });
        setShowNewAula(false);
        
        await loadAulas();
        
        alert('Aula criada com sucesso!');
      } catch (error) {
        console.error('Erro ao criar aula:', error);
        alert('Erro ao criar aula: ' + (error.response?.data?.error || 'Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    const criarArena = async () => {
      if (!novaArena.nome || !novaArena.cidade) {
        alert('Preencha nome e cidade da arena!');
        return;
      }

      try {
        setLoading(true);
        await api.post('/arenas', novaArena);
        
        setNovaArena({ nome: '', cidade: '', descricao: '' });
        setShowNovaArena(false);
        
        setArenasLoaded(false);
        await loadArenas();
        
        alert('Arena criada com sucesso!');
      } catch (error) {
        console.error('Erro ao criar arena:', error);
        alert('Erro ao criar arena: ' + (error.response?.data?.error || 'Apenas administradores podem criar arenas'));
      } finally {
        setLoading(false);
      }
    };

    const handleLogout = () => {
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      setView('login');
      setAulas([]);
      setAulasLoaded(false);
      setArenasLoaded(false);
    };

    const irParaPerfil = () => {
      setShowDetalhes(false);
      setAulaDetalhes(null);
      setView('perfil');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white bg-opacity-80 backdrop-blur sticky top-0 z-10 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={logo} alt="VemProJogo Logo" className="w-10 h-10 object-contain" />
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">VemProJogo</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={irParaPerfil}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium"
              >
                {profile?.foto_url ? (
                  <img 
                    src={`http://localhost:3000${profile.foto_url}`} 
                    alt="Perfil" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-md"
                  />
                ) : (
                  <User size={20} />
                )}
                <span className="hidden sm:inline">Perfil</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition font-medium"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Modal de Detalhes da Aula */}
        {showDetalhes && aulaDetalhes && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetalhes(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Detalhes da Aula</h2>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span>{formatarData(aulaDetalhes.data)}</span>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} />
                        <span className="text-sm font-semibold text-blue-500">{formatarHorario(aulaDetalhes.horario)} Horas</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mt-2">
                      <MapPin size={18} />
                      <span className="font-medium">{aulaDetalhes.local}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetalhes(false)}
                    className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={20} />
                    Participantes Confirmados ({aulaDetalhes.participantes?.length || 0})
                  </h3>
                  
                  {aulaDetalhes.participantes && aulaDetalhes.participantes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aulaDetalhes.participantes.map(participante => (
                        <div 
                          key={participante.id} 
                          onClick={() => setParticipanteSelecionado(participante)}
                          className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-blue-50 hover:shadow-md transition transform hover:scale-102"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {participante.foto_url ? (
                              <img 
                                src={`http://localhost:3000${participante.foto_url}`} 
                                alt={participante.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{participante.nome}</p>
                            {participante.id === user.id && (
                              <span className="text-xs text-blue-500">Você</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto mb-2 text-gray-300" />
                      <p>Nenhum participante confirmado ainda</p>
                      <p className="text-sm mt-1">Seja o primeiro a confirmar!</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {aulaDetalhes.participantes?.some(p => p.id === user.id) ? (
                    <button
                      type="button"
                      onClick={() => cancelarPresenca(aulaDetalhes.id)}
                      className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                    >
                      Cancelar Presença
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => confirmarPresenca(aulaDetalhes.id)}
                      className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                    >
                      Confirmar Presença
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDetalhes(false)}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {participanteSelecionado && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setParticipanteSelecionado(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Perfil do Jogador</h2>
                  <button
                    type="button"
                    onClick={() => setParticipanteSelecionado(null)}
                    className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-4">
                    {participanteSelecionado.foto_url ? (
                      <img 
                        src={`http://localhost:3000${participanteSelecionado.foto_url}`} 
                        alt={participanteSelecionado.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{participanteSelecionado.nome}</h3>
                  {participanteSelecionado.id === user.id && (
                    <span className="text-sm text-blue-500 font-medium">Você</span>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  {participanteSelecionado.nivel && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Nível</p>
                      <p className="text-lg font-medium text-blue-600">{participanteSelecionado.nivel}</p>
                    </div>
                  )}
                  
                  {participanteSelecionado.arena && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Arena</p>
                      <p className="text-lg font-medium text-green-600">{participanteSelecionado.arena}</p>
                    </div>
                  )}
                  
                  {participanteSelecionado.cidade && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Cidade</p>
                      <p className="text-lg font-medium text-purple-600">{participanteSelecionado.cidade}</p>
                    </div>
                  )}
                  
                  {participanteSelecionado.instagram && (
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Instagram</p>
                      <a 
                        href={`https://instagram.com/${participanteSelecionado.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-pink-600 hover:text-pink-700 underline"
                      >
                        {participanteSelecionado.instagram}
                      </a>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setParticipanteSelecionado(null)}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-2xl p-8 mb-8 text-white shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black mb-2">Olá, {profile?.nome || 'Jogador'}! 👋</h2>
                <p className="opacity-90 text-lg font-medium">{profile?.arena || 'Arena Principal'} • {profile?.cidade || 'Ribeirão Preto'}</p>
              </div>
              {profile?.is_admin && (
                <span className="bg-yellow-300 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ Admin
                </span>
              )}
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setShowNewAula(!showNewAula);
                setShowNovaArena(false);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition transform shadow-md"
            >
              <Plus size={20} />
              {showNewAula ? 'Fechar' : 'Nova Aula'}
            </button>
            
            {profile?.is_admin && (
              <button
                type="button"
                onClick={() => {
                  setShowNovaArena(!showNovaArena);
                  setShowNewAula(false);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition transform shadow-md"
              >
                <MapPin size={20} />
                {showNovaArena ? 'Fechar' : 'Nova Arena'}
              </button>
            )}
          </div>

          {showNovaArena && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-green-500">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Criar Nova Arena</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Arena*</label>
                  <input
                    type="text"
                    value={novaArena.nome}
                    onChange={(e) => setNovaArena({...novaArena, nome: e.target.value})}
                    placeholder="Ex: Posto 11"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cidade*</label>
                  <input
                    type="text"
                    value={novaArena.cidade}
                    onChange={(e) => setNovaArena({...novaArena, cidade: e.target.value})}
                    placeholder="Ex: Rio de Janeiro"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none bg-white transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={novaArena.descricao}
                    onChange={(e) => setNovaArena({...novaArena, descricao: e.target.value})}
                    placeholder="Ex: Arena principal na praia"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none bg-white transition"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={criarArena}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition transform disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Arena'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNovaArena(false);
                    setNovaArena({ nome: '', cidade: '', descricao: '' });
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {showNewAula && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Criar Nova Aula</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={novaAula.data}
                    onChange={(e) => setNovaAula({...novaAula, data: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Horário</label>
                  <input
                    type="time"
                    value={novaAula.horario}
                    onChange={(e) => setNovaAula({...novaAula, horario: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Local/Arena</label>
                  <select
                    value={novaAula.local}
                    onChange={(e) => setNovaAula({...novaAula, local: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
                  >
                    <option value="">Selecione uma arena</option>
                    {arenas.map(arena => (
                      <option key={arena.id} value={arena.nome}>
                        {arena.nome} - {arena.cidade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={criarAula}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition transform disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Aula'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAula(false);
                    setNovaAula({ data: '', horario: '', local: '' });
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {aulas.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma aula agendada</h3>
                <p className="text-gray-500">Clique em "Nova Aula" para criar a primeira!</p>
              </div>
            ) : (
              aulas.map(aula => {
                const participantes = parseInt(aula.participantes || 0);

                return (
                  <div 
                    key={aula.id} 
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-105 p-6 transition cursor-pointer border-l-4 border-blue-500"
                    onClick={() => verDetalhesAula(aula.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={18} className="text-blue-500" />
                        <span className="text-sm font-semibold">
                          {formatarData(aula.data, { 
                            weekday: 'short',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} className="text-blue-500" />
                        <span className="text-sm font-bold text-blue-600">{formatarHorario(aula.horario)} Horas</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700 mb-5">
                      <MapPin size={18} className="text-blue-500" />
                      <span className="font-semibold">{aula.local}</span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Users size={16} />
                        <span className="font-semibold">{participantes} {participantes === 1 ? 'participante' : 'participantes'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmarPresenca(aula.id);
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition transform"
                    >
                      ✓ Confirmar Presença
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    );
  };

  if (!user) return <Login />;
  if (view === 'perfil') return <Perfil />;
  return <Aulas />;
}

export default App;