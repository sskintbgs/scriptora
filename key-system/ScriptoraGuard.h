#ifndef SCRIPTORA_GUARD_H
#define SCRIPTORA_GUARD_H

#include <string>
#include <vector>

class ScriptoraGuard {
public:
    ScriptoraGuard(const std::string& appId, const std::string& appSecret);
    ~ScriptoraGuard();

    bool validate(const std::string& key);
    std::string getLevel() const;
    std::string getApp() const;
    long long getExpiresAt() const;

private:
    std::string m_appId;
    std::string m_appSecret;
    std::string m_level;
    std::string m_app;
    long long m_expiresAt;

    std::string sha256(const std::string& str);
    std::vector<unsigned char> deriveKey(const std::string& secret, const std::string& challenge);
    std::string httpPost(const std::string& url, const std::string& body);
    void securityCheck();
};

#endif // SCRIPTORA_GUARD_H
