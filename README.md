# Evolua

Aplicativo local-first para criar hobbies, acompanhar trilhas de progresso e registrar atividades no seu próprio ritmo.

## O que você pode fazer

- Criar uma trilha independente para cada hobby.
- Escolher os dias da semana em que deseja praticar; os demais são dias de descanso.
- Registrar atividades sem precisar adicionar uma foto.
- Acompanhar a sequência atual, o recorde e o histórico de etapas.
- Adicionar uma foto por dia em cada hobby. A foto também registra a prática daquele dia.
- Manter até dez fotos recentes por hobby. Ao exceder o limite, a imagem mais antiga é removida do armazenamento local, sem apagar a etapa do histórico.
- Salvar uma cópia independente na galeria do aparelho para preservar uma foto.

Hobbies, configurações e progresso ficam salvos no aparelho com AsyncStorage. As fotos recentes ficam nos arquivos locais do aplicativo; não há servidor nem Firebase.

## Tecnologia

- React Native com Expo SDK 54.
- JavaScript.
- AsyncStorage para dados locais.
- Expo Image Picker, FileSystem e MediaLibrary para selecionar, armazenar e preservar fotos.

## Como executar

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npx expo start
```

Abra o QR code no Expo Go ou execute:

```bash
npm run android
npm run web
```

Para testar a seleção e o salvamento de fotos em um aparelho Android, permita o acesso solicitado à galeria. O aplicativo não pede acesso à câmera porque a foto é selecionada da galeria.

## Conta de teste

- E-mail: `demo@evolua.com`
- Senha: `Evolua123`

Também é possível criar uma conta na tela inicial.

## Testes automatizados

```bash
npm test
```
