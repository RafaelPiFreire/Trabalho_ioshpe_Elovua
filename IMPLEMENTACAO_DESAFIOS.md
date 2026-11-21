# Relatório de implementação — Sistema de Desafios do Evolua

## Implementado nesta versão

- Tela de Desafios integrada à navegação existente.
- 13 categorias: Culinária, Leitura, Pintura, Desenho, Música, Fotografia, Programação, Jardinagem, Trabalhos manuais, Idiomas, Raciocínio lógico, Mecânica e Escrita.
- Catálogo inicial de 50 atividades por categoria (650 no total), distribuídas entre lições comuns e desafios com proporções diferentes por categoria.
- Quatro modalidades: surpresa, desenvolvimento, descoberta e personalizado.
- Seleção sequencial: uma recusa ou desistência não avança a sequência.
- Evita repetir atividades recentes quando há outras opções disponíveis.
- Progresso independente por categoria, limitado ao nível 50; após isso, a prática continua.
- Registro de conclusão, recusa e abandono, sem penalidades.
- Autoavaliação de 1 a 5 e evidência opcional.
- Registro de avaliações por marcos de 15 atividades, referência de aprovação de 75% e tentativas ilimitadas enquanto o resultado registrado não atingir a referência.
- Histórico completo de atividades e avaliações.
- Persistência dos dados de desafios no AsyncStorage, separada por usuário.
- Campos opcionais de descrição, duração e dificuldade em atividades personalizadas.

## Arquivos criados

- `src/services/desafios.js` — catálogo, regras de progressão, seleção, histórico, avaliações e persistência lógica.

## Arquivos modificados

- `src/screens/Desafios.js` — substituição da tela provisória pela interface do sistema.
- `src/services/armazenamento.js` — conexão do serviço de desafios ao AsyncStorage.
- `App.js` — envio do usuário autenticado à tela de desafios.
- `tests/evolua.test.mjs` — testes automatizados adicionais.

## O que foi preservado

- Navegação e abas existentes.
- Telas de Início, Trilha, Perfil, Configurações e Login.
- Serviços existentes de contas, trilhas e fotos.
- Componentes visuais e contexto de tema claro/escuro.
- Dependências e configuração Expo existentes; nenhuma biblioteca foi adicionada.

## Testes executados

- `npm test`: 16 testes aprovados, 0 falhas (incluindo teste de seleção por dificuldade).
- Análise sintática de 23 arquivos JavaScript/JSX: 0 erros de sintaxe.
- Verificação dos imports relativos: 0 imports locais ausentes.
- Testes cobrem quantidade de atividades, distribuição, isolamento por usuário/categoria, recusas, desistências, progressão sequencial, descoberta, desenvolvimento e tentativas de avaliação.

## Limitações e decisões pendentes

1. **Conteúdo pedagógico:** o catálogo contém 650 propostas de atividade geradas a partir de tópicos específicos e formatos de prática. Ainda não há 650 lições completas com explicações, exemplos, exercícios e gabaritos próprios. O conteúdo precisa de uma etapa editorial e pedagógica.
2. **Avaliações objetivas:** a tela permite registrar uma nota declarada pelo usuário e sua reflexão. O aplicativo ainda não aplica questionários objetivos ou rubricas práticas específicas por categoria. Portanto, a nota não é uma comprovação de domínio. A interface informa essa limitação.
3. **Alternativas semelhantes:** ao recusar, o usuário pode pedir outra sugestão, mas a seleção ainda não garante equivalência pedagógica com a atividade recusada.
4. **Adaptação da dificuldade:** a recomendação usa autoavaliações recentes. Ainda não utiliza resultados objetivos, pois os instrumentos objetivos por categoria não foram criados.
5. **Teste visual e execução do Expo:** não foi possível abrir o aplicativo em navegador, emulador ou celular neste ambiente. O projeto não tinha `node_modules`; por isso não foram executados `npm install` nem `npx expo start`.
6. **Armazenamento preexistente:** foi identificada uma divergência anterior à implementação: `README.md` descreve armazenamento local, mas `src/services/armazenamento.js` ainda usa Firebase para contas, enquanto trilhas, fotos e o novo sistema de desafios usam AsyncStorage. Essa parte foi preservada para evitar alteração fora do escopo, mas precisa ser revisada antes de considerar a arquitetura de armazenamento consistente.
7. **Identidade visual:** a nova tela reutiliza as cores e o tema azul/claro/escuro existentes. A validação visual final da identidade D depende de executar o app e revisar a tela em dispositivos.

## Observação

Esta entrega é uma primeira integração funcional e testada da lógica do sistema de desafios. Não deve ser considerada a versão final pedagógica ou visual do sistema até que as limitações acima sejam tratadas e o aplicativo seja executado em ambiente Expo.


## Ajustes desta revisão

- A modalidade Desenvolvimento agora seleciona atividades que correspondem à dificuldade escolhida, respeitando a categoria selecionada e evitando atividades já concluídas nessa categoria.
- Ao alterar a dificuldade enquanto Desenvolvimento está ativo, a atividade apresentada é atualizada automaticamente.
- Ao trocar a categoria durante Desenvolvimento, o aplicativo tenta atualizar a sugestão para a nova categoria.
- O cartão de progresso foi reorganizado como uma trilha visual com nós concluídos, próximo nível e etapas seguintes, mantendo o progresso e o histórico existentes.
