# 📧 Configuração do Sistema de Email - AKW Burguers

## 🚀 Como Configurar o EmailJS

Para que o sistema de mensagens funcione corretamente, você precisa configurar o EmailJS:

### 1. **Criar Conta no EmailJS**
- Acesse: https://www.emailjs.com/
- Crie uma conta gratuita
- Verifique seu email

### 2. **Configurar Serviço de Email**
- No dashboard, vá em "Email Services"
- Clique em "Add New Service"
- Escolha seu provedor de email (Gmail, Outlook, etc.)
- Siga as instruções para conectar sua conta

### 3. **Criar Template de Email**
- Vá em "Email Templates"
- Clique em "Create New Template"
- Use este template:

```html
Assunto: Nova mensagem do site AKW Burguers

De: {{name}} ({{email}})
Para: {{to_email}}

Mensagem:
{{message}}

---
Enviado através do site AKW Burguers
```

### 4. **Obter as Chaves**
- Vá em "Account" > "General"
- Copie sua **Public Key**
- Vá em "Email Services" e copie o **Service ID**
- Vá em "Email Templates" e copie o **Template ID**

### 5. **Atualizar o Código**
No arquivo `index.html`, substitua:

```javascript
// Linha 83
emailjs.init("YOUR_PUBLIC_KEY"); // Substitua pela sua Public Key

// Linha 108
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', formData)
```

### 6. **Exemplo de Configuração Completa**
```javascript
// Inicializar EmailJS
(function() {
  emailjs.init("user_1234567890abcdef"); // Sua Public Key
})();

// Enviar email
emailjs.send('service_gmail', 'template_akw_messages', formData)
```

## 🔧 Configuração Alternativa (Sem EmailJS)

Se preferir não usar EmailJS, você pode usar este código alternativo:

```javascript
// Sistema de mensagens alternativo
document.getElementById('messageForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('messageName').value,
    email: document.getElementById('messageEmail').value,
    message: document.getElementById('messageText').value,
    timestamp: new Date().toLocaleString('pt-BR')
  };
  
  // Simular envio (em produção, integrar com backend)
  console.log('Mensagem recebida:', formData);
  
  // Mostrar sucesso
  document.getElementById('messageStatus').innerHTML = 
    '<div class="success-message">✅ Mensagem registrada! Entraremos em contato em breve.</div>';
  
  // Limpar formulário
  document.getElementById('messageForm').reset();
  
  // Em produção, enviar para seu servidor/API
  // fetch('/api/send-message', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(formData)
  // });
});
```

## 📋 Checklist de Configuração

- [ ] Conta EmailJS criada
- [ ] Serviço de email configurado
- [ ] Template de email criado
- [ ] Public Key copiada
- [ ] Service ID copiado
- [ ] Template ID copiado
- [ ] Código atualizado no index.html
- [ ] Teste de envio realizado

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Carrinho
- Adicionar/remover itens
- Carrinho flutuante
- Persistência no localStorage
- Controles de quantidade
- Cálculo automático do total

### ✅ Sistema de Mensagens
- Formulário de contato
- Validação de email
- Integração com EmailJS
- Feedback visual
- Envio para: djazeitona289@gmail.com

### ✅ Melhorias Visuais
- Botões de quantidade elegantes
- Carrinho com animações
- Caixa de mensagens estilizada
- Design responsivo
- Cores consistentes da marca

## 🚨 Importante

1. **EmailJS é gratuito** até 200 emails/mês
2. **Teste sempre** após configurar
3. **Mantenha as chaves seguras**
4. **Backup do código** antes de alterar

---

**Desenvolvido com ❤️ para AKW Burguers**
