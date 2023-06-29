import asyncio
import telegram


# algo_33_ bot => "6139483884:AAFHkGZLz61iThPdEjqvffv5jLKOIh0NNEE"
# pine_test-bot => "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE"
# channel id (order calls) => -1001568215679
# channel test =>  -1001638761874
# group id (order calls) => -1001986223622
# channel id (IBKR status) => -1001967555467


class Logger:
    def __init__(self, BOT_TOKEN, CHAT_ID):
        self.BOT_TOKEN = (
            BOT_TOKEN if BOT_TOKEN else "6139483884:AAFHkGZLz61iThPdEjqvffv5jLKOIh0NNEE"
        )
        self.CHAT_ID = CHAT_ID if CHAT_ID else "474236507"
        self.BOT = telegram.Bot(token=self.BOT_TOKEN)

    def send(self, text, callback=None):
        print("SEND", self.CHAT_ID, text)
        bot_sms = self.BOT.send_message(
            chat_id=self.CHAT_ID, text=text, parse_mode="html"
        )
        sended = asyncio.get_event_loop().run_until_complete(bot_sms)
        print("TELEGRAM_SEND", sended)
        if callback:
            callback(sended)

    def reply(self, text, message_id, callback=None):
        print("REPLY_MSG")
        bot_sms = self.BOT.send_message(
            chat_id=self.CHAT_ID,
            text=text,
            parse_mode="html",
            reply_to_message_id=message_id,
        )
        sended = asyncio.get_event_loop().run_until_complete(bot_sms)
        print("TELEGRAM_Reply", sended)
        if callback:
            callback(sended)
