# Configuração do Driver Apache Impala

## Resumo
Este documento descreve as alterações realizadas para adicionar suporte ao driver Apache Impala no CloudBeaver.

## Alterações Realizadas

### 1. DBeaver (repositório: gestaogovbr/dbeaver)
- **Arquivo adicionado:** `drivers/ImpalaJDBC42.jar` (versão 2.6.37.1071)
- **Configuração:** Driver já estava configurado em `plugins/org.jkiss.dbeaver.ext.generic/plugin.xml`
- **Commit:** feat: Add Cloudera Impala JDBC driver JAR

### 2. CloudBeaver (repositório: gestaogovbr/cloudbeaver)
- **Diretório criado:** `server/drivers/impala/`
- **Arquivo adicionado:** `server/drivers/impala/ImpalaJDBC42.jar`
- **Arquivo modificado:** `server/drivers/impala/pom.xml` (novo)
- **Arquivo modificado:** `server/drivers/pom.xml` (adicionado módulo impala)
- **Arquivo modificado:** `server/bundles/io.cloudbeaver.resources.drivers.base/plugin.xml` (3 entradas)
- **Commit:** feat: Add Cloudera Impala JDBC driver support

## Como Usar

### Criar Nova Conexão
1. Acesse CloudBeaver
2. Clique em "New Connection" (+)
3. Selecione "Cloudera Impala"
4. Preencha os campos:
   - **Host:** acessostageha.serpro.gov.br
   - **Port:** 21050
   - **Database:** default
   - **User:** [fornecido pelo Serpro]
   - **Password:** [fornecido pelo Serpro]

### Propriedades Adicionais (se necessário)
Em "Driver Properties", adicione:
- `SSL=1`
- `AuthMech=3`
- `SocketTimeout=15`

## Referências
- Driver JDBC: Cloudera Impala JDBC Driver 2.6.37.1071
- Documentação: https://www.cloudera.com/downloads/connectors/impala/jdbc.html
