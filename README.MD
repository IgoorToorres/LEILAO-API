** ENTIDADES

- User (participante do leilao)
- Auction (leilao)
- Lot (lote/ites leilados)
- Bid (lance)
- Winner (resultado do leilao)
- Payment (pagamento do vencedor)
- Wallet (limite de crédito/caução)
- Notification (eventos de dominio para alertas)

** Value Objects 

- Money (valor com moeda)
- AuctionPeriod (inicio/fim, janela de extensão)
- UserStatus (verificado, bloqueado, inadimplente)
- AuctionStatus (draft, scheduled, running finished, canceled)

** Agregate

- Auction (como aggregate root, contendo Lots, Bids e regras de encerramento )
- User (como aggregate root, contendo Wallet)

** regras de negocio

- lance minimo incremental ( ex: +5% ou valor fixo minimo)
- Auto-extensao do leilao se ouver lance nos ultimos x minutos
- limite de lances por usuario ou por periodo
- verificação de usuario obrigatoria para dar lance
- bloqueio automatico de usuarios com pagamentos pendentes
- caucao/limite de credito exigido para dar lance
- politicas de desempate (tempo do lance, perioridade do usuario, etc)
- cancelamento do leilao com condicoes rigidas (ex:  so antes de iniciar)
- anti-sniping com janela de "cooldown"
- regras diferentes por tipo de lote (ex: item uinico vs lote multiplo)

** use cases 

- CreateAuction (cria um leilao em estado inicial (draft)) validando periodo e dados minimos
- AddLotAuction (adiciona um lite/items) ao leilao apenas se o leilao ainda estiver em draft
- ScheduleAuction agenda o leilao para iniciar no futuro, validando periodo e requisitos(ex: lotes obrigatorios)
- StartAuction ( inicia o leilão no horário certo, mudando status para running.)
- PlaceBid (registra um lance válido, aplicando regras de valor mínimo, usuário apto e janela do leilão.)
- CancelBid (permite cancelar um lance apenas se regras específicas forem atendidas (ex: lance não vencedor e janela permitida).)
- CloseAuction (encerra o leilão, calcula o vencedor e muda status para finished.)
- FinalizeAuction (confirma a finalização após pagamento, atualizando o resultado.)
- BlockUser (bloqueia um usuário por regra de negócio (ex: inadimplência), impedindo novos lances.)
- UnblockUser (remove o bloqueio quando condições são atendidas (ex: pagamento regularizado).)
- ApproveUserVerification (aprova a verificação do usuário, liberando acesso aos lances.)
- RegisterPayment (registra pagamento relacionado ao leilão e ao vencedor.)

** Eventos de dominio

- AuctionStarted (o leilao entrou em execucao (running))
- BidPlaced (um lance valido foi registrado)
- AuctionExtended (o termino do leilao foi prorrogado por regra de extensao)
- AuctionFinished (o leilao foi encerrado)
- WinnerDefined (o vencedor foi definido com o lance vencedor)
- PaymentConfirmed (pagamento do vencedor confirmado)
- UserBlocked (o usuario foi bloqueado por regra de negocio)


----------------------------------------------------------------------

** explcacao dos status

draft: leilão em rascunho. Pode ser criado e editado, mas ainda não está pronto para ocorrer.
scheduled: leilão programado para iniciar em uma data/hora futura.
running: leilão em andamento, aceitando lances.
finished: leilão encerrado, não aceita mais lances e já tem um resultado.
canceled: leilão cancelado antes de finalizar, sem vencedor válido.


** tasks

- [x] Definir o **Ubiquitous Language** do domínio de leilão
- [ ] Mapear **entidades** e **value objects** do core
- [ ] Especificar **agregados** e invariantes principais
- [ ] Detalhar **use-cases** com pré/pós-condições
- [ ] Definir **eventos de domínio** e seus gatilhos
- [ ] Delimitar **bounded contexts** e suas responsabilidades
- [ ] Desenhar o **fluxo principal** do ciclo de vida do leilão
- [ ] Escolher o **recorte inicial (MVP do core)** para implementação