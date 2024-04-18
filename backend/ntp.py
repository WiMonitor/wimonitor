import ntplib as ntp
import config

def test_ntp_servers(servers):
    """The actual function that test connection to NTP servers. It can be called directy with a list of NTP servers.

    Args:
        servers (array): a string array of NTP servers to test

    Returns:
        responses (dict): a dict of responses from NTP server. If the server is not online or having issues, the value will be None. Otherwise, 6 metrics listed below will be inlcuded. See code for more details.
    """
    client = ntp.NTPClient()
    responses = {}
    for server in servers:
        try:
            response = client.request(server)
            responses[server] = {}
            responses[server]["local_sent_on"] = response.orig_time # the time the NTP request was sent
            responses[server]["server_received_on"] = response.recv_time # the time the NTP request was received by the server
            responses[server]["server_responded_on"] = response.tx_time # the time the NTP response was sent by the server
            responses[server]["local_received_on"] = response.dest_time # the time the NTP response was received by the client
            responses[server]["offset"] = response.offset # MOST IMPORTANT METRIC: the offset between local time and server time
            responses[server]["stratum"] = response.stratum # the stratum of the server
            
            if abs(response.offset) > config.NTP_OFFSET_THRESHOLD: # test offset against threshold
                responses[server]["status"] = "failed"
                # TODO: put it into error log
            else:
                responses[server]["status"] = "success"
        except ntp.NTPException as e: # TODO: put it into error log
            responses[server] = None
            print(f"Error: {e}, server: {server} not online")
        except Exception as e:
            print(f"Error: {e}")
            
    return responses
        
        


def __get_local_ntp_config__():
    """Read the NTP servers from the local NTP configuration file. Uses config.NTP_FILE_PATH.

    Returns:
        servers (array): An array of NTP servers found in ntp.conf
    """
    servers = []
    with open(config.NTP_FILE_PATH, 'r') as f:
        lines = f.readlines()
        for line in lines:
            line = line.strip()
            if line.startswith("pool") or line.startswith("server"):
                server = line.split()[1]
                servers.append(server)       
    return servers


def test_local_ntp_servers():
    """An easy-to-use function to test the NTP servers found in the local NTP configuration file.

    Returns:
        (array): see test_ntp_servers for details
    """
    return test_ntp_servers(__get_local_ntp_config__())