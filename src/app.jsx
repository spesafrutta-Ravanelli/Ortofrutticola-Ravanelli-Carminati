import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Search, Plus, Edit2, Trash2, Save, X, LogOut, Menu } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const ADMIN_PASSWORD = 'admin123';

  // Carica prodotti da Supabase
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Errore nel caricamento prodotti:', error);
      alert('Errore nel caricamento dei prodotti');
    } finally {
      setLoading(false);
    }
  };

  // Salva prodotto (nuovo o modifica)
  const saveProduct = async (product) => {
    try {
      if (product.id) {
        // Modifica prodotto esistente
        const { error } = await supabase
          .from('products')
          .update({
            name: product.name,
            category: product.category,
            price: parseFloat(product.price),
            unit: product.unit,
            image: product.image,
            description: product.description,
            origin: product.origin,
            inStock: product.inStock
          })
          .eq('id', product.id);

        if (error) throw error;
      } else {
        // Nuovo prodotto
        const { error } = await supabase
          .from('products')
          .insert([{
            name: product.name,
            category: product.category,
            price: parseFloat(product.price),
            unit: product.unit,
            image: product.image,
            description: product.description,
            origin: product.origin,
            inStock: product.inStock
          }]);

        if (error) throw error;
      }

      await loadProducts();
      setShowProductForm(false);
      setEditingProduct(null);
      alert('Prodotto salvato con successo!');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio del prodotto');
    }
  };

  // Elimina prodotto
  const deleteProduct = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
      alert('Prodotto eliminato!');
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione del prodotto');
    }
  };

  const categories = ['Tutti', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tutti' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.inStock;
  });

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Password errata!');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setEditingProduct(null);
    setShowProductForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800 text-lg">Caricamento prodotti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍎</span>
              <h1 className="text-2xl md:text-3xl font-bold text-green-800">Ortofrutticola R&C</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {!isAdminMode && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 hover:bg-green-50 rounded-full transition-colors"
                >
                  <ShoppingCart className="w-6 h-6 text-green-700" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => isAdminMode ? handleAdminLogout() : setShowAdminLogin(true)}
                className="p-2 hover:bg-green-50 rounded-full transition-colors"
              >
                {isAdminMode ? <LogOut className="w-6 h-6 text-red-600" /> : <User className="w-6 h-6 text-green-700" />}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-green-50 rounded-full"
              >
                <Menu className="w-6 h-6 text-green-700" />
              </button>
            </div>
          </div>

          {/* Barra di ricerca */}
          {!isAdminMode && (
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca prodotti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Modalità Admin */}
        {isAdminMode && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                <span className="font-semibold text-yellow-800">Modalità Amministratore</span>
              </div>
              <button
                onClick={() => setShowProductForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Aggiungi Prodotto
              </button>
            </div>
          </div>
        )}

        {/* Categorie */}
        {!isAdminMode && (
          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-2 pb-2 min-w-max md:min-w-0 md:flex-wrap md:justify-center">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-green-700 hover:bg-green-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Griglia Prodotti */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                <p className="text-xs text-gray-500 mb-2">🌍 {product.origin}</p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-green-600">€{product.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">/ {product.unit}</span>
                </div>

                {isAdminMode ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductForm(true);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifica
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Elimina
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Aggiungi al carrello
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nessun prodotto trovato</p>
          </div>
        )}
      </div>

      {/* Carrello Sidebar */}
      {isCartOpen && !isAdminMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsCartOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Carrello</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">Il carrello è vuoto</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-4 mb-4 pb-4 border-b">
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-green-600">€{item.price.toFixed(2)} / {item.unit}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="font-bold">€{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between mb-4">
                      <span className="text-xl font-bold">Totale:</span>
                      <span className="text-2xl font-bold text-green-600">€{totalPrice.toFixed(2)}</span>
                    </div>
                    <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold">
                      Procedi all'acquisto
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Admin Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAdminLogin(false)}>
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Login Amministratore</h2>
            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdminLogin}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Accedi
              </button>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Prodotto */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSave={saveProduct}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState(product || {
    name: '',
    category: 'Mele',
    price: '',
    unit: 'kg',
    image: '',
    description: '',
    origin: '',
    inStock: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">{product ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option>Mele</option>
              <option>Banane</option>
              <option>Arance</option>
              <option>Pere</option>
              <option>Kiwi</option>
              <option>Fragole</option>
              <option>Limoni</option>
              <option>Verdure</option>
              <option>Altro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prezzo (€)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Unità</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option>kg</option>
                <option>vaschetta</option>
                <option>pezzo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL Immagine</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrizione</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Provenienza</label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.inStock}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
              className="w-5 h-5"
            />
            <label className="text-sm font-medium">Disponibile</label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Salva
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;