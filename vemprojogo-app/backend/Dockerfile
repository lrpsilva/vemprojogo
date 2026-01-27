# 1. Escolhe a imagem base (Node.js)
FROM node:24-alpine

# 2. Cria a pasta de trabalho dentro do container
WORKDIR /app

# 3. Copia os arquivos de dependências primeiro (otimiza o cache)
COPY package*.json ./

# 4. Instala as dependências
RUN npm install

# 5. Copia o restante dos arquivos do seu projeto
COPY . .

# 6. Porta que o seu Express vai rodar (geralmente 3000 ou 5000)
EXPOSE 3000

# 7. Comando para iniciar o servidor
# CMD ["node", "index.js"]
CMD ["npm", "run", "dev"]