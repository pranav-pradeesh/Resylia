'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface PeerMatch {
  peerId: string
  peerName: string
  challenge: string
  compatibility: number
  status: string
}

const challenges = [
  { id: 'workload', emoji: '📚', label: 'Heavy workload' },
  { id: 'manager', emoji: '👔', label: 'Manager relationship' },
  { id: 'work_life', emoji: '⚖️', label: 'Work-life balance' },
  { id: 'growth', emoji: '📈', label: 'Career growth' },
  { id: 'team', emoji: '👥', label: 'Team dynamics' },
  { id: 'skill', emoji: '💻', label: 'Skill gap' },
  { id: 'remote', emoji: '🏠', label: 'Remote work' },
  { id: 'meeting', emoji: '📅', label: 'Meeting overload' },
]

export default function PeersPage() {
  const [myChallenge, setMyChallenge] = useState('')
  const [matches, setMatches] = useState<PeerMatch[]>([])
  const [connections, setConnections] = useState<PeerMatch[]>([])
  const [searching, setSearching] = useState(false)

  const connectWithPeer = async (peerId: string) => {
    setConnections([...connections, { peerId, peerName: 'Peer', challenge: '', compatibility: 0, status: 'requested' }])
    setMatches(matches.filter(m => m.peerId !== peerId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Your People 🤝</h1>
        <p className="text-gray-500">Connect with peers facing similar challenges</p>

        {!myChallenge && !matches.length && !connections.length && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-4 text-center">
            <span className="text-5xl">🌱</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-3">You're Not Alone</h3>
            <p className="text-gray-500 text-sm mt-2 mb-4">Select a challenge you're facing. We'll anonymously match you with someone who gets it.</p>
            <div className="grid grid-cols-2 gap-2">
              {challenges.map((challenge) => (
                <button key={challenge.id} onClick={() => setMyChallenge(challenge.id)}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                  <span className="text-xl">{challenge.emoji}</span>
                  <p className="text-sm font-medium text-gray-700 mt-1">{challenge.label}</p>
                </button>
              ))}
            </div>
            {myChallenge && (
              <button onClick={() => { setSearching(true); setTimeout(() => setSearching(false), 1000) }}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium mt-4 hover:bg-emerald-600">
                {searching ? 'Finding peers...' : 'Find My People →'}
              </button>
            )}
          </motion.div>
        )}

        {myChallenge && (matches.length > 0 || connections.length > 0) && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Your Challenge</h3>
                <button onClick={() => setMyChallenge('')} className="text-xs text-gray-500">Change</button>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <span className="text-xl">{challenges.find(c => c.id === myChallenge)?.emoji}</span>
                <span className="font-medium text-gray-700">{challenges.find(c => c.id === myChallenge)?.label}</span>
              </div>
            </div>

            {matches.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">New Matches</h3>
                <div className="space-y-2">
                  {matches.map((match) => (
                    <div key={match.peerId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 font-bold">{match.peerName.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{match.peerName}</p>
                            <p className="text-xs text-gray-500">{Math.round(match.compatibility * 100)}% match</p>
                          </div>
                        </div>
                        <button onClick={() => connectWithPeer(match.peerId)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">
                          Connect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {connections.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Your Connections</h3>
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <div key={conn.peerId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">{conn.peerName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{conn.peerName}</p>
                          <p className="text-xs text-gray-500">{conn.status === 'requested' ? 'Pending...' : 'Connected ✓'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}