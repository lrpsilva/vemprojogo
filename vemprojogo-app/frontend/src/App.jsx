import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Plus, LogOut, User, Image, Trash2, Clock } from 'lucide-react';
import axios from 'axios';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-500 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Futevôlei</h1>
            <p className="text-gray-600 mt-2">Organize suas aulas</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-gray-400"
            >
              {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-500 hover:underline text-sm"
            >
              {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Perfil = () => {
    const [nome, setNome] = useState(profile?.nome || '');
    const [arena, setArena] = useState(profile?.arena || '');
    const [cidade, setCidade] = useState(profile?.cidade || '');

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
        const response = await api.put('/auth/profile', { nome, arena, cidade });
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
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
        await loadAulas();
        
        // Se está visualizando detalhes, atualizar
        if (showDetalhes && aulaDetalhes?.id === aulaId) {
          verDetalhesAula(aulaId);
        }
      } catch (error) {
        alert(error.response?.data?.error || 'Erro ao confirmar presença');
      }
    };

    const cancelarPresenca = async (aulaId) => {
      try {
        await api.delete(`/presencas/${aulaId}`);
        await loadAulas();
        
        // Se está visualizando detalhes, atualizar
        if (showDetalhes && aulaDetalhes?.id === aulaId) {
          verDetalhesAula(aulaId);
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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="text-blue-500" size={28} />
              <h1 className="text-xl font-bold text-gray-800">Futevôlei</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={irParaPerfil}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                {profile?.foto_url ? (
                  <img 
                    src={`http://localhost:3000${profile.foto_url}`} 
                    alt="Perfil" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <User size={20} />
                )}
                <span className="hidden sm:inline">Perfil</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
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
                        <div key={participante.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
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

        <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Olá, {profile?.nome || 'Jogador'}! 👋</h2>
                <p className="opacity-90">{profile?.arena || 'Arena Principal'} • {profile?.cidade || 'Ribeirão Preto'}</p>
              </div>
              {profile?.is_admin && (
                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                  Admin
                </span>
              )}
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                console.log('Clicou Nova Aula, estado atual:', showNewAula);
                setShowNewAula(!showNewAula);
                setShowNovaArena(false);
              }}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition shadow-md"
            >
              <Plus size={20} />
              {showNewAula ? 'Fechar Formulário' : 'Nova Aula'}
            </button>
            
            {profile?.is_admin && (
              <button
                type="button"
                onClick={() => {
                  setShowNovaArena(!showNovaArena);
                  setShowNewAula(false);
                }}
                className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition shadow-md"
              >
                <MapPin size={20} />
                {showNovaArena ? 'Fechar' : 'Nova Arena'}
              </button>
            )}
          </div>

          {showNovaArena && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Criar Nova Arena</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Arena*</label>
                  <input
                    type="text"
                    value={novaArena.nome}
                    onChange={(e) => setNovaArena({...novaArena, nome: e.target.value})}
                    placeholder="Ex: Posto 11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade*</label>
                  <input
                    type="text"
                    value={novaArena.cidade}
                    onChange={(e) => setNovaArena({...novaArena, cidade: e.target.value})}
                    placeholder="Ex: Rio de Janeiro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={novaArena.descricao}
                    onChange={(e) => setNovaArena({...novaArena, descricao: e.target.value})}
                    placeholder="Ex: Arena principal na praia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={criarArena}
                  disabled={loading}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition disabled:bg-gray-400 shadow-md"
                >
                  {loading ? 'Criando...' : 'Criar Arena'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNovaArena(false);
                    setNovaArena({ nome: '', cidade: '', descricao: '' });
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition shadow-md"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {showNewAula && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Criar Nova Aula</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={novaAula.data}
                    onChange={(e) => setNovaAula({...novaAula, data: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário</label>
                  <input
                    type="time"
                    value={novaAula.horario}
                    onChange={(e) => setNovaAula({...novaAula, horario: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Local/Arena</label>
                  <select
                    value={novaAula.local}
                    onChange={(e) => setNovaAula({...novaAula, local: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition disabled:bg-gray-400 shadow-md"
                >
                  {loading ? 'Criando...' : 'Criar Aula'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAula(false);
                    setNovaAula({ data: '', horario: '', local: '' });
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition shadow-md"
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
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                    onClick={() => verDetalhesAula(aula.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={18} />
                        <span className="text-sm">
                          {formatarData(aula.data, { 
                            weekday: 'short',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} />
                        <span className="text-sm font-semibold text-blue-500">{formatarHorario(aula.horario)} Horas</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700 mb-4">
                      <MapPin size={18} />
                      <span className="font-medium">{aula.local}</span>
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
                      className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                    >
                      Confirmar Presença
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