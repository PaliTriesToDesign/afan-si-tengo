import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// A deliberately tiny router — no react-router dependency, to keep
// the bundle small for people on unreliable connections. Handles
// exactly what this app needs: a handful of flat routes plus query
// params, with back/forward support.

const RouterContext = createContext(null)

export function RouterProvider({ children }) {
  const [path, setPath] = useState(window.location.pathname)
  const [search, setSearch] = useState(window.location.search)

  useEffect(() => {
    function onPopState() {
      setPath(window.location.pathname)
      setSearch(window.location.search)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to) => {
    window.history.pushState({}, '', to)
    const url = new URL(to, window.location.origin)
    setPath(url.pathname)
    setSearch(url.search)
  }, [])

  const query = new URLSearchParams(search)

  return (
    <RouterContext.Provider value={{ path, query, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  return useContext(RouterContext)
}
