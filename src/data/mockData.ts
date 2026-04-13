export interface Computer {
  id: string;
  nome: string;
  patrimonio: string;
  localizacao: string;
  status: "Ativo" | "Manutenção" | "Inativo";
  ultimaManutencao: string;
}

export interface Manutencao {
  id: string;
  computador: string;
  problema: string;
  tecnico: string;
  data: string;
  status: "Pendente" | "Em andamento" | "Concluída";
  prioridade: "Alta" | "Média" | "Baixa";
}

export interface Peca {
  id: string;
  nome: string;
  codigo: string;
  estoque: number;
  minimo: number;
  status: "Normal" | "Baixo" | "Crítico";
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "Administrador" | "Técnico" | "Usuário";
  status: "Ativo" | "Inativo";
}

export const computadores: Computer[] = [
  { id: "1", nome: "Lab01-PC01", patrimonio: "PAT-001", localizacao: "Laboratório 01", status: "Ativo", ultimaManutencao: "15/04/2024" },
  { id: "2", nome: "Lab02-PC02", patrimonio: "PAT-002", localizacao: "Laboratório 02", status: "Ativo", ultimaManutencao: "10/04/2024" },
  { id: "3", nome: "Biblioteca-PC01", patrimonio: "PAT-003", localizacao: "Biblioteca", status: "Manutenção", ultimaManutencao: "20/04/2024" },
  { id: "4", nome: "SalaAula07-PC05", patrimonio: "PAT-004", localizacao: "Sala de Aula 07", status: "Ativo", ultimaManutencao: "18/04/2024" },
  { id: "5", nome: "Diretoria-PC01", patrimonio: "PAT-005", localizacao: "Diretoria", status: "Ativo", ultimaManutencao: "12/04/2024" },
  { id: "6", nome: "Lab03-PCTI", patrimonio: "PAT-006", localizacao: "Laboratório 03", status: "Inativo", ultimaManutencao: "05/04/2024" },
  { id: "7", nome: "Lab01-PC03", patrimonio: "PAT-007", localizacao: "Laboratório 01", status: "Manutenção", ultimaManutencao: "22/04/2024" },
  { id: "8", nome: "Biblioteca-PC20", patrimonio: "PAT-008", localizacao: "Biblioteca", status: "Ativo", ultimaManutencao: "21/04/2024" },
];

export const manutencoes: Manutencao[] = [
  { id: "1", computador: "Lab01-PC03", problema: "Problema de Rede", tecnico: "Carlos Mendes", data: "23/04/2024", status: "Em andamento", prioridade: "Alta" },
  { id: "2", computador: "Biblioteca-PC20", problema: "Sistema Lento", tecnico: "Ana Beatriz", data: "22/04/2024", status: "Concluída", prioridade: "Média" },
  { id: "3", computador: "SalaAula07-PC05", problema: "Limpeza Interna", tecnico: "Rafael Costa", data: "22/04/2024", status: "Concluída", prioridade: "Baixa" },
  { id: "4", computador: "Lab02-PC10", problema: "Substituir HD", tecnico: "Carlos Mendes", data: "23/04/2024", status: "Pendente", prioridade: "Alta" },
  { id: "5", computador: "Lab03-PC11", problema: "Erro na Inicialização", tecnico: "Ana Beatriz", data: "21/04/2024", status: "Em andamento", prioridade: "Média" },
  { id: "6", computador: "Diretoria-PC01", problema: "Atualização de Software", tecnico: "Rafael Costa", data: "20/04/2024", status: "Concluída", prioridade: "Baixa" },
  { id: "7", computador: "Lab01-PC01", problema: "Tela azul", tecnico: "Carlos Mendes", data: "19/04/2024", status: "Concluída", prioridade: "Alta" },
  { id: "8", computador: "Biblioteca-PC01", problema: "Sem conexão WiFi", tecnico: "Ana Beatriz", data: "23/04/2024", status: "Pendente", prioridade: "Média" },
];

export const pecas: Peca[] = [
  { id: "1", nome: "HD 1TB SATA", codigo: "HD1039", estoque: 2, minimo: 5, status: "Baixo" },
  { id: "2", nome: "Fonte 500W", codigo: "FR5672", estoque: 1, minimo: 3, status: "Baixo" },
  { id: "3", nome: "Memória RAM 8GB", codigo: "MR8128", estoque: 0, minimo: 4, status: "Crítico" },
  { id: "4", nome: "Teclado USB", codigo: "TEC1298", estoque: 3, minimo: 5, status: "Baixo" },
  { id: "5", nome: "Mouse USB", codigo: "MOU4521", estoque: 8, minimo: 5, status: "Normal" },
  { id: "6", nome: "Monitor 21\"", codigo: "MON2100", estoque: 4, minimo: 3, status: "Normal" },
  { id: "7", nome: "Cabo de Rede Cat6", codigo: "CAB6001", estoque: 15, minimo: 10, status: "Normal" },
  { id: "8", nome: "SSD 240GB", codigo: "SSD2400", estoque: 1, minimo: 3, status: "Baixo" },
];

export const usuarios: Usuario[] = [
  { id: "1", nome: "João Silva", email: "joao@eetepa.edu.br", tipo: "Administrador", status: "Ativo" },
  { id: "2", nome: "Ana Beatriz", email: "ana@eetepa.edu.br", tipo: "Técnico", status: "Ativo" },
  { id: "3", nome: "Carlos Mendes", email: "carlos@eetepa.edu.br", tipo: "Técnico", status: "Ativo" },
  { id: "4", nome: "Juliana Pereira", email: "juliana@eetepa.edu.br", tipo: "Usuário", status: "Ativo" },
  { id: "5", nome: "Rafael Costa", email: "rafael@eetepa.edu.br", tipo: "Técnico", status: "Ativo" },
  { id: "6", nome: "Mariana Lima", email: "mariana@eetepa.edu.br", tipo: "Usuário", status: "Inativo" },
];

export const chartData = {
  manutencoes7dias: [
    { dia: "17/04", concluidas: 5, emAndamento: 3, pendentes: 2 },
    { dia: "18/04", concluidas: 6, emAndamento: 4, pendentes: 1 },
    { dia: "19/04", concluidas: 8, emAndamento: 3, pendentes: 2 },
    { dia: "20/04", concluidas: 7, emAndamento: 5, pendentes: 3 },
    { dia: "21/04", concluidas: 10, emAndamento: 4, pendentes: 2 },
    { dia: "22/04", concluidas: 12, emAndamento: 5, pendentes: 3 },
    { dia: "23/04", concluidas: 11, emAndamento: 6, pendentes: 4 },
  ],
  statusPizza: [
    { name: "Concluídas", value: 50, fill: "hsl(142, 60%, 40%)" },
    { name: "Em andamento", value: 29, fill: "hsl(214, 65%, 50%)" },
    { name: "Pendentes", value: 21, fill: "hsl(38, 92%, 50%)" },
  ],
  manutencoesMensal: [
    { mes: "Nov", total: 15 },
    { mes: "Dez", total: 20 },
    { mes: "Jan", total: 18 },
    { mes: "Fev", total: 22 },
    { mes: "Mar", total: 25 },
    { mes: "Abr", total: 24 },
  ],
};
