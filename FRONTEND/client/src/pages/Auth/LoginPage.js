import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/LoginPage.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const from = location.state?.from?.pathname || '/profile';

    try {
      await login(formData.email, formData.password);

      navigate(from, { replace: true });


    } catch (err) {
      console.error('Errore durante il login:', err);
      setError(err.message || 'Errore durante il login. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="text-center">Accedi a TableTalk</h2>
        
        {location.state?.message && (
          <Alert variant="success">{location.state.message}</Alert>
        )}
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
  <Form.Label>Password</Form.Label>
  {/* Usiamo InputGroup per contenere sia l'input che l'icona */}
  <InputGroup>
    <Form.Control
      type={showPassword ? 'text' : 'password'} // <-- Tipo dinamico!
      name="password"
      value={formData.password}
      onChange={handleChange}
      required
      placeholder="La tua password"
    />
    {/* Questo è il componente per l'icona. È cliccabile. */}
    <InputGroup.Text
      onClick={() => setShowPassword(!showPassword)} // Inverte lo stato da true a false e viceversa
      style={{ cursor: 'pointer' }} // Fa apparire la "manina" del cursore
    >
      {/* Mostriamo un'icona diversa a seconda dello stato */}
      {showPassword ? <FaEyeSlash /> : <FaEye />}
    </InputGroup.Text>
  </InputGroup>
</Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 mb-3"
            disabled={isLoading}
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
          
          <div className="text-center">
            <p className="mb-0">
              Non hai un account? <Link to="/register">Registrati</Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;