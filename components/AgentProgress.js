const AGENT_META = {
  currency: { label: 'Currency Risk', icon: '💱', desc: 'Analyzing exchange rates and forex volatility...' },
  climate: { label: 'Climate Risk', icon: '🌡️', desc: 'Evaluating climate patterns and flood risk...' },
  geopolitical: { label: 'Geopolitical Risk', icon: '🌍', desc: 'Assessing political stability and conflict data...' },
  economic: { label: 'Economic Risk', icon: '📊', desc: 'Reviewing GDP, inflation, and economic indicators...' },
  fraud: { label: 'Fraud & Market Risk', icon: '🔍', desc: 'Checking title integrity and market data...' },
  environmental: { label: 'Environmental Risk', icon: '🌱', desc: 'Scanning pollution and environmental hazards...' },
  market: { label: 'Market Risk', icon: '📈', desc: 'Evaluating real estate market dynamics...' },
  ai: { label: 'AI Risk', icon: '🤖', desc: 'Analyzing tech disruption and automation impact...' },
};

export default function AgentProgress({ agents, currentAgent, progress, totalAgents }) {
  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-sm font-medium">Overall Progress</span>
          <span className="text-brand-400 text-sm font-semibold">{Math.round((progress / totalAgents) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-brand-600 to-brand-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(progress / totalAgents) * 100}%` }}
          />
        </div>
      </div>

      {/* Agent list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(AGENT_META).map(([key, meta]) => {
          const agentState = agents[key];
          const isRunning = currentAgent === key;
          const isComplete = agentState?.status === 'complete';
          const isPending = !isRunning && !isComplete;

          return (
            <div
              key={key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isRunning
                  ? 'border-brand-500/60 bg-brand-900/20'
                  : isComplete
                  ? 'border-green-500/30 bg-green-900/10'
                  : 'border-slate-700/50 bg-slate-800/30'
              }`}
            >
              <div className="text-2xl flex-shrink-0 mt-0.5">{meta.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isComplete ? 'text-green-400' : isRunning ? 'text-brand-300' : 'text-slate-400'}`}>
                    {meta.label}
                  </span>
                  {isRunning && (
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1 h-1 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                  {isComplete && (
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isPending ? 'text-slate-600' : isRunning ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isComplete ? `Score: ${agentState.score}/100` : isRunning ? meta.desc : 'Waiting...'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
