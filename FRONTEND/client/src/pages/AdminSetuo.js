import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const AdminSetup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    setupKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/setup-first-admin', formData);
      
      // Salva i dati di autenticazione
      setAuthData({
        token: response.data.token,
        user: response.data.user
      });
      
      toast.success('Account admin configurato con successo!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Errore durante la configurazione dell\'admin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Configura il primo amministratore
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Questa operazione può essere eseguita solo una volta
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mt-1"
                placeholder="Email amministratore"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mt-1"
                placeholder="Password sicura"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">Nickname</label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mt-1"
                placeholder="Nickname"
                value={formData.nickname}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="setupKey" className="block text-sm font-medium text-gray-700">Chiave di setup</label>
              <input
                id="setupKey"
                name="setupKey"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mt-1"
                placeholder="Chiave segreta di setup"
                value={formData.setupKey}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">La chiave di setup è definita nel file .env del server</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? 'Configurazione in corso...' : 'Configura Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSetup;