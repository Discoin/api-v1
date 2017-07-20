# Discoin

Sometimes your users found hard to earn a specific virtual currency on a specific bot that they enjoy. Sometimes your users found easy to earn another currency on another bot but they have nowhere to use it. For these reasons your users will abandon both bots and turn to a bot that allow them to earn and use the currency wisely.

Introducing **Discoin**, a universal currency allowing users to exchange currencies from one bot to another bot.

## Definition of a central currency
**Discoin** is a currency that is __solely used to be exchanged into other bots' currencies.__ It is only used during transactions.

Exchange rates with other bot currencies are discussed based on rarity. They're fixed unless methods used to earn currencies has changed significantly.

## Technology
A central API should be created so that each participating bot can send requests and receive requests to process transactions.

Let's say a user wants to exchange A bot currency to B bot currency.

1. The user requests exchanging on A bot
2. In the API, A bot sends a message indicates that a transaction has been started.
3. API converts the currency and leaves a message waiting for B bot to pick up.
3. B bot picks the message up and finishes the transaction.
4. The user is notified by B bot indicates that the transaction has been finished.

## Obligation on participating developers
Participating developers should not abuse their privilege of manipulating the currency, including but not limited to adding a high amount of currency to themselves and convert them into other currencies. Violators will be banned from this program.

## API
API source can be found in this repo.

### Tokens
Tokens are issued under Austin Huang's approval.

### Start a transaction
```
GET https://discoin.herokuapp.com/transaction/:user/:amount/:to
```

#### Header
* Authorization: Your token.

#### Params
* User: User ID of the user who started the transaction.
* Amount: Raw amount in *your* currency
* To: Destination currency code

#### Result
Plain text: Either `Submitted.` or an error starting with `[ERROR]`.

### Receive unprocessed transactions
```
GET https://discoin.herokuapp.com/transaction
```

#### Header
* Authorization: Your token.

#### Result
Either a JSON array of unprocessed transactions, or a plain text error starting with `[ERROR]`.

### Check rates and currency codes
https://discoin.herokuapp.com/rates

**UNSUITABLE FOR DEVELOPER USE.** The API itself calculates the currency for you so don't use this as rates! This page is only for regular users.
