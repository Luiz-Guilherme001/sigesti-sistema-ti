import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Como cadastro um novo computador no sistema?",
    a: "Acesse o menu 'Computadores' na barra lateral e clique em 'Novo Computador'. Preencha os campos obrigatórios (nome, patrimônio, localização, laboratório) e clique em Salvar.",
  },
  {
    q: "Como registro uma manutenção?",
    a: "Vá até o menu 'Manutenção' e clique em 'Nova Manutenção'. Informe o computador, técnico responsável, problema, prioridade e, se aplicável, a peça utilizada.",
  },
  {
    q: "Como adiciono um novo usuário administrador?",
    a: "Apenas administradores podem criar novos usuários. Acesse 'Usuários' no menu lateral, clique em 'Novo Usuário', preencha os dados e selecione o papel 'Administrador'.",
  },
  {
    q: "Esqueci minha senha. O que fazer?",
    a: "Na tela de login, clique em 'Esqueci minha senha' e siga as instruções enviadas para o seu email cadastrado. Se o problema persistir, entre em contato com o suporte.",
  },
];

const Help = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Central de Ajuda</h1>
          <p className="text-muted-foreground">Encontre respostas para as dúvidas mais comuns</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;