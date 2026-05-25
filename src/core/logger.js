// Structured JSON logger for MFM Corporation agents

export function log(level, agent, event, data = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    agent,
    event,
    ...data,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
  return entry;
}

export const logger = {
  info:  (agent, event, data) => log('info',  agent, event, data),
  warn:  (agent, event, data) => log('warn',  agent, event, data),
  error: (agent, event, data) => log('error', agent, event, data),
  debug: (agent, event, data) => log('debug', agent, event, data),
};
