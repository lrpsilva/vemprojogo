import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Plus, LogOut, User, Image, Trash2 } from 'lucide-react';
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

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('login');
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aulasLoaded, setAulasLoaded] = useState(false);

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
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    {profile?.foto_url ? (
                      <img src={`http://localhost:5000${profile.foto_url}`} alt="Perfil" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <User size={40} className="text-gray-400" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                    <Image size={16} />
                  </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Arena (Local de Jogo)</label>
                <input
                  type="text"
                  value={arena}
                  onChange={(e) => setArena(e.target.value)}
                  placeholder="Ex: Arena Copacabana, Posto 11"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Rio de Janeiro"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
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
    const [novaAula, setNovaAula] = useState({ data: '', horario: '', local: '' });

    useEffect(() => {
      if (!aulasLoaded) {
        loadAulas();
      }
    }, []);

    const confirmarPresenca = async (aulaId) => {
      try {
        await api.post('/presencas', { aula_id: aulaId });
        await loadAulas();
      } catch (error) {
        alert(error.response?.data?.error || 'Erro ao confirmar presença');
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

    const handleLogout = () => {
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      setView('login');
      setAulas([]);
      setAulasLoaded(false);
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
                onClick={() => setView('perfil')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <User size={20} />
                <span className="hidden sm:inline">Perfil</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Olá, {profile?.nome || 'Jogador'}! 👋</h2>
            <p className="opacity-90">{profile?.arena || 'Arena Principal'} • {profile?.cidade || 'Ribeirão Preto'}</p>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                console.log('Clicou Nova Aula, estado atual:', showNewAula);
                setShowNewAula(!showNewAula);
              }}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition shadow-md"
            >
              <Plus size={20} />
              {showNewAula ? 'Fechar Formulário' : 'Nova Aula'}
            </button>
          </div>

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
                  <input
                    type="text"
                    value={novaAula.local}
                    onChange={(e) => setNovaAula({...novaAula, local: e.target.value})}
                    placeholder="Ex: Posto 11, Quadra 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
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
                  <div key={aula.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={18} />
                        <span className="text-sm">
                          {new Date(aula.data + 'T00:00:00').toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-blue-500">{aula.horario}</span>
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
                      onClick={() => confirmarPresenca(aula.id)}
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