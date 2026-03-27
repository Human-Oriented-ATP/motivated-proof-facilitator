/**
 * MoveSetContext — manages named move sets that persist in localStorage.
 *
 * A move set is an ordered list of ProofDiscoveryMove objects (built-in and/or
 * custom). The context exposes the active set and CRUD helpers. Changes are
 * written to localStorage so they survive page reloads.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { ProofDiscoveryMove } from "../core/ProofDiscoveryMove"
import { moves as builtInMoves } from "../prompts/AllMoves"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoveSet {
  id: string
  name: string
  /** IDs of built-in moves that are enabled (undefined = all enabled for built-in set) */
  enabledBuiltInNames: string[] | null   // null → use all built-in moves
  /** User-defined moves appended after built-in ones. */
  customMoves: ProofDiscoveryMove[]
  /** Names of moves (built-in or custom) that are currently disabled. */
  disabledMoveNames: string[]
}

interface MoveSetStore {
  sets: MoveSet[]
  activeSetId: string
}

interface MoveSetContextValue {
  sets: MoveSet[]
  activeSet: MoveSet
  activeMoves: ProofDiscoveryMove[]       // resolved list of enabled moves
  setActiveSetId: (id: string) => void
  createSet: (name: string, copyFromId?: string) => MoveSet
  renameSet: (id: string, name: string) => void
  deleteSet: (id: string) => void
  addMove: (move: ProofDiscoveryMove, setId?: string) => void
  updateMove: (setId: string, oldName: string, move: ProofDiscoveryMove) => void
  removeMove: (setId: string, moveName: string) => void
  toggleMoveEnabled: (setId: string, moveName: string) => void
  isMoveEnabled: (setId: string, moveName: string) => boolean
  isMoveCustom: (setId: string, moveName: string) => boolean
  exportSetAsJson: (setId: string) => void
  exportMoveAsJson: (move: ProofDiscoveryMove) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "motivated-proof-move-sets"

const DEFAULT_SET_ID = "default"

function makeDefaultSet(): MoveSet {
  return {
    id: DEFAULT_SET_ID,
    name: "Default",
    enabledBuiltInNames: null,
    customMoves: [],
    disabledMoveNames: [],
  }
}

function loadStore(): MoveSetStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MoveSetStore
      // Ensure default set always exists
      if (!parsed.sets.find(s => s.id === DEFAULT_SET_ID)) {
        parsed.sets.unshift(makeDefaultSet())
      }
      return parsed
    }
  } catch {
    // ignore malformed storage
  }
  return { sets: [makeDefaultSet()], activeSetId: DEFAULT_SET_ID }
}

function saveStore(store: MoveSetStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota errors
  }
}

function resolveMoves(set: MoveSet): ProofDiscoveryMove[] {
  const base: ProofDiscoveryMove[] =
    set.enabledBuiltInNames === null
      ? builtInMoves
      : builtInMoves.filter(m => set.enabledBuiltInNames!.includes(m.name))

  const all = [...base, ...set.customMoves]
  return all.filter(m => !set.disabledMoveNames.includes(m.name))
}

function downloadJson(filename: string, obj: unknown): void {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const MoveSetContext = createContext<MoveSetContextValue | null>(null)

export function useMoveSet(): MoveSetContextValue {
  const ctx = useContext(MoveSetContext)
  if (!ctx) throw new Error("useMoveSet must be used inside MoveSetProvider")
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MoveSetProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [store, setStore] = useState<MoveSetStore>(() => loadStore())
  const storeRef = useRef(store)
  storeRef.current = store

  // Persist on every change
  useEffect(() => {
    saveStore(store)
  }, [store])

  const update = useCallback((fn: (s: MoveSetStore) => MoveSetStore) => {
    setStore(prev => {
      const next = fn(prev)
      storeRef.current = next
      return next
    })
  }, [])

  const activeSet = store.sets.find(s => s.id === store.activeSetId) ?? store.sets[0] ?? makeDefaultSet()

  const setActiveSetId = useCallback((id: string) => {
    update(s => ({ ...s, activeSetId: id }))
  }, [update])

  const createSet = useCallback((name: string, copyFromId?: string): MoveSet => {
    const source = (copyFromId ? store.sets.find(s => s.id === copyFromId) : undefined) ?? store.sets[0] ?? makeDefaultSet()
    const newSet: MoveSet = {
      id: `set-${Date.now()}`,
      name,
      enabledBuiltInNames: source.enabledBuiltInNames ? [...source.enabledBuiltInNames] : null,
      customMoves: source.customMoves.map(m => ({ ...m })),
      disabledMoveNames: [...source.disabledMoveNames],
    }
    update(s => ({ ...s, sets: [...s.sets, newSet], activeSetId: newSet.id }))
    return newSet
  }, [store.sets, update])

  const renameSet = useCallback((id: string, name: string) => {
    update(s => ({ ...s, sets: s.sets.map(set => set.id === id ? { ...set, name } : set) }))
  }, [update])

  const deleteSet = useCallback((id: string) => {
    if (id === DEFAULT_SET_ID) return  // can't delete default
    update(s => {
      const sets = s.sets.filter(set => set.id !== id)
      const activeSetId = s.activeSetId === id ? DEFAULT_SET_ID : s.activeSetId
      return { sets, activeSetId }
    })
  }, [update])

  const addMove = useCallback((move: ProofDiscoveryMove, setId?: string) => {
    const targetId = setId ?? store.activeSetId
    update(s => ({
      ...s,
      sets: s.sets.map(set =>
        set.id !== targetId ? set : {
          ...set,
          customMoves: [...set.customMoves.filter(m => m.name !== move.name), move],
        }
      ),
    }))
  }, [store.activeSetId, update])

  const updateMove = useCallback((setId: string, oldName: string, move: ProofDiscoveryMove) => {
    update(s => ({
      ...s,
      sets: s.sets.map(set => {
        if (set.id !== setId) return set
        return {
          ...set,
          customMoves: set.customMoves.map(m => m.name === oldName ? move : m),
          // If name changed, update disabledMoveNames too
          disabledMoveNames: set.disabledMoveNames.map(n => n === oldName ? move.name : n),
        }
      }),
    }))
  }, [update])

  const removeMove = useCallback((setId: string, moveName: string) => {
    update(s => ({
      ...s,
      sets: s.sets.map(set =>
        set.id !== setId ? set : {
          ...set,
          customMoves: set.customMoves.filter(m => m.name !== moveName),
          disabledMoveNames: set.disabledMoveNames.filter(n => n !== moveName),
        }
      ),
    }))
  }, [update])

  const toggleMoveEnabled = useCallback((setId: string, moveName: string) => {
    update(s => ({
      ...s,
      sets: s.sets.map(set => {
        if (set.id !== setId) return set
        const disabled = set.disabledMoveNames.includes(moveName)
          ? set.disabledMoveNames.filter(n => n !== moveName)
          : [...set.disabledMoveNames, moveName]
        return { ...set, disabledMoveNames: disabled }
      }),
    }))
  }, [update])

  const isMoveEnabled = useCallback((setId: string, moveName: string): boolean => {
    const set = storeRef.current.sets.find(s => s.id === setId)
    return !set?.disabledMoveNames.includes(moveName)
  }, [])

  const isMoveCustom = useCallback((setId: string, moveName: string): boolean => {
    const set = storeRef.current.sets.find(s => s.id === setId)
    return !!set?.customMoves.find(m => m.name === moveName)
  }, [])

  const exportSetAsJson = useCallback((setId: string) => {
    const set = storeRef.current.sets.find(s => s.id === setId)
    if (!set) return
    const resolved = resolveMoves(set)
    downloadJson(`${set.name.replace(/\s+/g, '-')}-moves.json`, resolved)
  }, [])

  const exportMoveAsJson = useCallback((move: ProofDiscoveryMove) => {
    downloadJson(`${move.name.replace(/\s+/g, '-')}.json`, move)
  }, [])

  const activeMoves = resolveMoves(activeSet)

  return (
    <MoveSetContext.Provider value={{
      sets: store.sets,
      activeSet,
      activeMoves,
      setActiveSetId,
      createSet,
      renameSet,
      deleteSet,
      addMove,
      updateMove,
      removeMove,
      toggleMoveEnabled,
      isMoveEnabled,
      isMoveCustom,
      exportSetAsJson,
      exportMoveAsJson,
    }}>
      {children}
    </MoveSetContext.Provider>
  )
}
