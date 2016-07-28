import java.io.IOException;

import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import org.apache.commons.lang3.StringUtils;
import org.glassfish.tyrus.server.Server;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ServerEndpoint("/")
public class WebsocketClientEndpoint {
	private static Session session;
	private static final Logger logger = LoggerFactory.getLogger(WebsocketClientEndpoint.class);
	@OnOpen
    public void onOpen(Session _session) throws IOException {
		session = _session;
		logger.info("open");
    }

    @OnMessage
    public void echo(String message) {
    	logger.info(message);
    	if (StringUtils.contains(message, "\"action\":\"play\"")){
    		try {
				Thread.sleep(4000);
				String ret = "{\"callback\":\"play\",\"state\":\"finished\"}";
				sendMessage(ret);
			} catch (InterruptedException e) {}
    	}
    }
    
    @OnError
    public void onError(Throwable t) {
    	logger.info("error:"+t.toString());
    }

    @OnClose
    public void onClose(Session session) {
    	logger.info("close");
    }
    
    /**
     * Send a message.
     *
     * @param message
     */
    public static void sendMessage(String message) {
        session.getAsyncRemote().sendText(message);
    }

    public static void main(String[] args) throws Exception{
		Server server = new Server("localhost", 8000, "/", null, WebsocketClientEndpoint.class);
		server.start();
		logger.info("Starte Websocket Server ...");
		new Thread(new Runnable() {
			@Override
			public void run() {
				try {
					while (true){
						Thread.sleep(20000);
						if (session !=null && session.isOpen()){
							sendMessage("{\"message ...\":"+System.currentTimeMillis()+"}");
						}
					}
				} catch (Exception e) {
					System.err.println(e.toString());
				}
			}
		}).start();
	}
    
}
