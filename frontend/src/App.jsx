import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Collections from './pages/Collections'
import About from './pages/About'
import Search from './pages/Search'
import CollectionDetail from './pages/CollectionDetail'
import ArchiveCollections from './pages/ArchiveCollections'
import ArchiveCollectionDetail from './pages/ArchiveCollectionDetail'
import AdvancedSearch from './pages/AdvancedSearch'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/archive/collections" element={<ArchiveCollections />} />
            <Route path="/archive/collections/:id" element={<ArchiveCollectionDetail />} />
            <Route path="/archive/search" element={<AdvancedSearch />} />
            <Route path="/about" element={<About />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
