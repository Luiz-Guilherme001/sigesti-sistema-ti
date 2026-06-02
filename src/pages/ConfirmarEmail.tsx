import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ConfirmarEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const confirmEmail = async () => {
      // Seu link está com ?token=URL_ENCODADA
      const token = searchParams.get('token');
      
            
      if (!token) {
        setStatus('error');
        toast.error('Token não encontrado');
        setTimeout(() => navigate('/'), 3000);
        return;
      }
      
      // O token é uma URL completa! Vamos extrair o token real
      let realToken = '';
      try {
        // Tenta extrair o token da URL
        const url = new URL(decodeURIComponent(token));
        realToken = url.searchParams.get('token') || '';
        
      } catch (e) {
        // Se não for uma URL, usa o token como está
        realToken = token;
      }
      
      if (!realToken) {
        setStatus('error');
        toast.error('Token inválido');
        setTimeout(() => navigate('/'), 3000);
        return;
      }
      
      const { error } = await supabase.auth.verifyOtp({
        token_hash: realToken,
        type: 'email'
      });
      
      if (error) {
        console.error('Erro:', error);
        setStatus('error');
        toast.error(error.message || 'Link inválido ou expirado');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setStatus('success');
        toast.success('Email confirmado com sucesso!');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Email Confirmado!</h1>
          <p className="text-gray-400">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-red-500 text-6xl mb-4">✗</div>
          <h1 className="text-2xl font-bold mb-2">Falha na Confirmação</h1>
          <p className="text-gray-400">O link é inválido ou expirou.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-primary rounded-lg hover:bg-primary/80"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Confirmando seu e-mail...</p>
      </div>
    </div>
  );
}