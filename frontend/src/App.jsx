import React, { useState, useEffect } from 'react';
import RetroNavbar from './components/Common/RetroNavbar';
import BattleArena from './components/Battle/BattleArena';
import BattleLogSidebar from './components/Log/BattleLogSidebar';
import TeamOverview from './components/Teambuilder/TeamOverview';
import OpponentPicker from './components/OpponentPicker/OpponentPicker';
import {
  iniciarBatalha,
  executarTurno,
  trocarPokemonBatalha,
  usarItemBatalha,
  getStatusBatalha,
  getLogsBatalha,
  cancelarBatalha,
  getMochila,
  chamarCentroPokemon
} from './services/api';
import sounds from './services/soundEffects';

export default function App() {
  const [activeTab, setActiveTab] = useState('battle');
  const [batalhaEstado, setBatalhaEstado] = useState(null);
  const [logs, setLogs] = useState([]);
  const [mochila, setMochila] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joyLoading, setJoyLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Exibir toast / notificação retrô
  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Carregar mochila do jogador
  const carregarMochila = async () => {
    try {
      const res = await getMochila(1);
      if (res.sucesso) setMochila(res.dados);
    } catch (err) {
      console.warn('Erro ao carregar mochila:', err);
    }
  };

  // Iniciar ou retomar batalha contra Blue por padrão
  const handleIniciarBatalha = async (oponenteId = 2, forcar = false) => {
    setLoading(true);
    try {
      const res = await iniciarBatalha(1, oponenteId, forcar);
      if (res.sucesso) {
        setBatalhaEstado(res.estado);
        setLogs(res.logs || []);
        setActiveTab('battle');
        notify('Batalha iniciada com sucesso!', 'success');
      }
    } catch (err) {
      notify(`Erro ao iniciar batalha: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Executar ação de ataque (Turno)
  const handleExecuteTurn = async (movimentoId) => {
    if (!batalhaEstado?.batalha?.id) return;
    setLoading(true);
    try {
      const res = await executarTurno(batalhaEstado.batalha.id, movimentoId);
      if (res.sucesso) {
        setBatalhaEstado(res.estado);
        setLogs(res.logs || []);
        return res;
      }
    } catch (err) {
      notify(`Erro no turno: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trocar Pokémon ativo
  const handleSwitchPokemon = async (novoPokemonId) => {
    if (!batalhaEstado?.batalha?.id) return;
    setLoading(true);
    try {
      const res = await trocarPokemonBatalha(batalhaEstado.batalha.id, novoPokemonId);
      if (res.sucesso) {
        setBatalhaEstado(res.estado);
        setLogs(res.logs || []);
        notify('Troca realizada! O oponente retaliou no turno.', 'info');
      }
    } catch (err) {
      notify(`Erro ao trocar: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Usar item da mochila
  const handleUseItem = async (itemId, alvoPokemonId) => {
    if (!batalhaEstado?.batalha?.id) return;
    setLoading(true);
    try {
      const res = await usarItemBatalha(batalhaEstado.batalha.id, itemId, alvoPokemonId);
      if (res.sucesso) {
        setBatalhaEstado(res.estado);
        setLogs(res.logs || []);
        carregarMochila();
        notify('Item utilizado com sucesso!', 'success');
      }
    } catch (err) {
      notify(`Erro ao usar item: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fugir ou Desistir
  const handleRun = async () => {
    if (!batalhaEstado?.batalha?.id) return;
    if (window.confirm('Deseja realmente fugir/encerrar a batalha atual?')) {
      try {
        await cancelarBatalha(batalhaEstado.batalha.id);
        notify('Você fugiu com segurança da batalha!', 'info');
        handleIniciarBatalha(2, true);
      } catch (err) {
        notify(`Erro ao fugir: ${err.message}`, 'error');
      }
    }
  };

  // Curar time com a Joy
  const handleQuickJoy = async () => {
    setJoyLoading(true);
    try {
      const res = await chamarCentroPokemon(1);
      notify(res.mensagem || 'Time curado pela Enfermeira Joy!', 'success');
      // Atualizar status se houver batalha
      if (batalhaEstado?.batalha?.id) {
        const atualizado = await getStatusBatalha(batalhaEstado.batalha.id);
        if (atualizado.sucesso) setBatalhaEstado(atualizado.estado);
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setJoyLoading(false);
    }
  };

  // Inicialização
  useEffect(() => {
    carregarMochila();
    handleIniciarBatalha(2, false);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de Navegação Retrô */}
      <RetroNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickJoy={handleQuickJoy}
        joyLoading={joyLoading}
      />

      {/* Notificação Toast Retrô */}
      {notification && (
        <div
          className="retro-text"
          style={{
            position: 'fixed',
            top: '75px',
            right: '20px',
            zIndex: 60,
            background: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : '#3b82f6',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: '2px solid #000'
          }}
        >
          {notification.msg}
        </div>
      )}

      {/* Conteúdo Principal */}
      <main style={{ flex: 1, padding: '20px', maxWidth: '1380px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'battle' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)',
              gap: '20px',
              alignItems: 'start'
            }}
          >
            {/* Coluna Esquerda: Arena de Batalha GBA */}
            <div>
              {batalhaEstado ? (
                <BattleArena
                  batalhaEstado={batalhaEstado}
                  mochila={mochila}
                  onExecuteTurn={handleExecuteTurn}
                  onSwitchPokemon={handleSwitchPokemon}
                  onUseItem={handleUseItem}
                  onRun={handleRun}
                  onRematch={() => handleIniciarBatalha(batalhaEstado?.batalha?.treinador_oponente_id || 2, true)}
                  onBackToBuilder={() => setActiveTab('teambuilder')}
                  loading={loading}
                />
              ) : (
                <div className="gba-panel-dark" style={{ padding: '40px', textAlign: 'center' }}>
                  <p className="retro-text" style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                    Nenhuma batalha em andamento.
                  </p>
                  <button
                    onClick={() => handleIniciarBatalha(2, true)}
                    className="btn-retro btn-fight"
                  >
                    ⚔️ INICIAR BATALHA CONTRA BLUE
                  </button>
                </div>
              )}
            </div>

            {/* Coluna Direita: Sidebar de Logs em Tempo Real */}
            <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 110px)' }}>
              <BattleLogSidebar
                logs={logs}
                turnoAtual={batalhaEstado?.batalha?.turno_atual || 1}
              />
            </div>
          </div>
        )}

        {activeTab === 'teambuilder' && (
          <TeamOverview
            mochila={mochila}
            onReloadMochila={carregarMochila}
            onStartBattle={() => setActiveTab('opponents')}
            onNotify={notify}
          />
        )}

        {activeTab === 'opponents' && (
          <OpponentPicker
            onSelectOpponent={(id) => handleIniciarBatalha(id, true)}
            onStartBattle={(id) => handleIniciarBatalha(id, true)}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}
