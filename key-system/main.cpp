#include <iostream>
#include "ScriptoraGuard.h"

int main() {
    // Note: Use XOR strings for your REAL ID/Secret
    ScriptoraGuard guard("YOUR_APP_ID", "YOUR_APP_SECRET");

    std::cout << "--- Scriptora Security System ---" << std::endl;
    std::cout << "Enter Key: ";
    std::string key;
    std::cin >> key;

    if (guard.validate(key)) {
        std::cout << "[+] Access Granted!" << std::endl;
        std::cout << "[+] Tier: " << guard.getLevel() << std::endl;
        
        // Start your app here
    } else {
        std::cout << "[!] Access Denied." << std::endl;
    }

    return 0;
}
