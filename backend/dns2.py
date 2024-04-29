# this file is named dns2 because python will be confused when import dns.resolver, it will consider it as a loop import.
import dns.resolver, config, socket

def get_local_dns_servers():
    """Helper function to read the local DNS servers from the /etc/resolv.conf file.

    Returns:
        dns_servers (list): List of local DNS server found.
    """
    dns_servers = []
    try:
        with open(config.DNS_FILE_PATH, "r") as file:
            for line in file:
                if line.startswith('nameserver'):
                    dns_servers.append(line.strip().split()[1])
    except Exception as e:
        print(f"Error reading DNS servers: {e}")
    return dns_servers

def test_dns_connectivity(dns_servers, test_domain):
    """This function tests the reachability and resolution of DNS servers. If the DNS is not reachable, the resolution test will be skipped.

    Args:
        dns_servers (list): List of DNS servers to test
        test_domain (str): Domain to resolve using DNS servers

    Returns:
        results (dict): Result of DNS server connectivity and resolution tests
    """
    results = {}
    for server in dns_servers:
        # Test DNS server is reachable
        try:
            sock = socket.create_connection((server, 53), timeout=config.DNS_TIMEOUT)
            sock.close()
            results[server] = {"dns_reachable": True}
        except Exception as e: # TODO: add to error log
            results[server] = {"dns_reachable": False}
            print(f"Failed to connect to {server}: {e}")
            continue # if not reachable, skip resolution test
        
        # Test DNS server resolution
        resolver = dns.resolver.Resolver()
        resolver.nameservers = [server]
        try:
            answers = resolver.resolve(test_domain)
            results[server]["resolution_success"] = True
            results[server]["target_domain"] = test_domain
            results[server]["resolved_ips"] = [answer.address for answer in answers]
        except Exception as e: # TODO: add to error log
            results[server]["resolution_success"] = False
            print(f"Failed to resolve {test_domain} using {server}: {e}")
    return results

def test_local_dns_servers(test_domain):
    """This is an easy-to-use wrapper function to test the local DNS servers.

    Args:
        test_domain (str): Domain to resolve using DNS servers

    Returns:
        (dict): See test_dns_connectivity() for details
    """
    return test_dns_connectivity(get_local_dns_servers(), test_domain)