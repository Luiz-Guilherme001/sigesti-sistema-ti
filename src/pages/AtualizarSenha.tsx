import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AtualizarSenha() {
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]               = useState(false);
  const [valid, setValid]                   = useState(false);
  const [checking, setChecking]             = useState(true);
  const navigate                            = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValid(true);
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        setValid(true);
        setChecking(false);
      }
    });

    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setValid(true);
        } else {
          setValid(false);
          toast.error('Link inválido ou expirado. Solicite um novo.');
        }
        setChecking(false);
      });
    }, 5000);

    // Único return de cleanup
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha alterada com sucesso!');
      await supabase.auth.signOut();
      setTimeout(() => navigate('/'), 2000);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
          <p className="mt-4">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center bg-gray-800 p-8 rounded-xl max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Link inválido</h1>
          <p>Este link de recuperação expirou ou é inválido.</p>
          <p className="text-sm text-gray-400 mt-2">Solicite um novo link em "Esqueceu a senha?"</p>
          <Button onClick={() => navigate('/')} className="mt-4">Voltar ao login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="text-green-500 text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-white">Redefinir senha</h1>
          <p className="text-gray-400 text-sm mt-1">Digite sua nova senha abaixo</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nova senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>
          <Button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </div>
      </div>
    </div>
  );
}