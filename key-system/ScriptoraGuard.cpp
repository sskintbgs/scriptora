#include "ScriptoraGuard.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <vector>
#include <thread>
#include <chrono>
#include <fstream>
#include <curl/curl.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/sha.h>
#include "json.hpp"

using json = nlohmann::json;

// --- CONFIGURATION ---
const std::string CURRENT_VERSION = "1.0.0";

// --- SECURITY: STRING OBFUSCATION ---
template <size_t N>
class XorString {
public:
    char data[N];
    constexpr XorString(const char* str) : data{} {
        for (size_t i = 0; i < N; ++i) data[i] = str[i] ^ 0x5A;
    }
    std::string decrypt() const {
        std::string s = "";
        for (size_t i = 0; i < N - 1; ++i) s += (char)(data[i] ^ 0x5A);
        return s;
    }
};
#define _X(str) XorString<sizeof(str)>(str).decrypt().c_str()

const std::string API_BASE = _X("http://localhost:3001/api/keys");

#ifdef _WIN32
#include <windows.h>
#include <tlhelp32.h>
#include <intrin.h>

// --- ADVANCED SECURITY: HARDWARE BREAKPOINT DETECTION ---
bool check_hardware_breakpoints() {
    CONTEXT ctx = { 0 };
    ctx.ContextFlags = CONTEXT_DEBUG_REGISTERS;
    if (GetThreadContext(GetCurrentThread(), &ctx)) {
        return (ctx.Dr0 != 0 || ctx.Dr1 != 0 || ctx.Dr2 != 0 || ctx.Dr3 != 0);
    }
    return false;
}

// --- ADVANCED SECURITY: MEMORY INTEGRITY (ANTI-PATCH) ---
size_t calculate_code_checksum() {
    char* base = (char*)GetModuleHandle(NULL);
    size_t checksum = 0;
    for (int i = 0; i < 1024; i++) checksum += base[i]; 
    return checksum;
}

bool is_vm_detected() {
    const char* vm_files[] = { "C:\\windows\\System32\\Drivers\\Vmmouse.sys", "C:\\windows\\System32\\Drivers\\vboxguest.sys" };
    for (auto f : vm_files) {
        if (FILE* file = fopen(f, "r")) { fclose(file); return true; }
    }
    int cpuInfo[4];
    __cpuid(cpuInfo, 1);
    if ((cpuInfo[2] >> 31) & 1) return true;
    return false;
}

// --- AUTO-UPDATER LOGIC ---
void perform_update(const std::string& downloadUrl) {
    std::cout << "[>] A new version is available. Downloading update..." << std::endl;
    
    CURL* curl = curl_easy_init();
    if (curl) {
        FILE* fp = fopen("update_new.exe", "wb");
        curl_easy_setopt(curl, CURLOPT_URL, downloadUrl.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, fp);
        curl_easy_perform(curl);
        fclose(fp);
        curl_easy_cleanup(curl);
    }

    std::cout << "[>] Update downloaded. Restarting..." << std::endl;

    // Create a batch script to swap the files
    char path[MAX_PATH];
    GetModuleFileNameA(NULL, path, MAX_PATH);
    std::string exePath = path;
    
    std::ofstream bat("updater.bat");
    bat << "@echo off\n";
    bat << "timeout /t 2 /nobreak > nul\n"; // Wait for current process to exit
    bat << "del \"" << exePath << "\"\n";
    bat << "move \"update_new.exe\" \"" << exePath << "\"\n";
    bat << "start \"\" \"" << exePath << "\"\n";
    bat << "del \"%~f0\"\n";
    bat.close();

    ShellExecuteA(NULL, "open", "updater.bat", NULL, NULL, SW_HIDE);
    exit(0);
}

// --- ADVANCED SECURITY: TLS CALLBACK ---
void NTAPI tls_callback(PVOID DllHandle, DWORD Reason, PVOID Reserved) {
    if (Reason == DLL_PROCESS_ATTACH) {
        if (IsDebuggerPresent() || check_hardware_breakpoints()) exit(0);
    }
}
#ifdef _M_IX86
#pragma comment (linker, "/INCLUDE:__tls_used")
#pragma comment (linker, "/INCLUDE:_tls_callback_func")
#else
#pragma comment (linker, "/INCLUDE:_tls_used")
#pragma comment (linker, "/INCLUDE:tls_callback_func")
#endif
typedef void (NTAPI* PIMAGE_TLS_CALLBACK)(PVOID, DWORD, PVOID);
#ifdef _M_IX86
extern "C" PIMAGE_TLS_CALLBACK tls_callback_func = tls_callback;
#else
extern "C" const PIMAGE_TLS_CALLBACK tls_callback_func = tls_callback;
#endif
#pragma const_seg(".CRT$XLB")
#pragma data_seg(".CRT$XLB")
#endif

// --- BACKGROUND SECURITY THREAD ---
void security_heartbeat() {
    while (true) {
        if (IsDebuggerPresent() || check_hardware_breakpoints()) exit(0);
        std::this_thread::sleep_for(std::chrono::seconds(10));
    }
}

// --- HEX HELPERS ---
static std::string to_hex(const unsigned char* data, size_t len) {
    std::stringstream ss;
    for(size_t i = 0; i < len; ++i) ss << std::hex << std::setw(2) << std::setfill('0') << (int)data[i];
    return ss.str();
}

static std::vector<unsigned char> from_hex(const std::string& hex) {
    std::vector<unsigned char> bytes;
    for (unsigned int i = 0; i < hex.length(); i += 2) {
        bytes.push_back((unsigned char)strtol(hex.substr(i, 2).c_str(), NULL, 16));
    }
    return bytes;
}

// --- SCRIPTORA GUARD IMPLEMENTATION ---

ScriptoraGuard::ScriptoraGuard(const std::string& appId, const std::string& appSecret) 
    : m_appId(appId), m_appSecret(appSecret), m_expiresAt(0) {
    curl_global_init(CURL_GLOBAL_ALL);
    std::thread(security_heartbeat).detach(); // Start background monitor
}

ScriptoraGuard::~ScriptoraGuard() {
    curl_global_cleanup();
}

std::string ScriptoraGuard::sha256(const std::string& str) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)str.c_str(), str.size(), hash);
    return to_hex(hash, SHA256_DIGEST_LENGTH);
}

std::vector<unsigned char> ScriptoraGuard::deriveKey(const std::string& secret, const std::string& challenge) {
    std::string combined = secret + challenge;
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)combined.c_str(), combined.size(), hash);
    return std::vector<unsigned char>(hash, hash + SHA256_DIGEST_LENGTH);
}

static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

std::string ScriptoraGuard::httpPost(const std::string& url, const std::string& body) {
    CURL* curl = curl_easy_init();
    std::string readBuffer;
    if(curl) {
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, _X("Content-Type: application/json"));
        headers = curl_slist_append(headers, _X("User-Agent: ScriptoraGuard/4.0"));
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
        curl_easy_perform(curl);
        curl_easy_cleanup(curl);
    }
    return readBuffer;
}

void ScriptoraGuard::securityCheck() {
#ifdef _WIN32
    if (IsDebuggerPresent() || check_hardware_breakpoints()) exit(0);
    if (is_vm_detected()) exit(0);
    static size_t original_checksum = calculate_code_checksum();
    if (calculate_code_checksum() != original_checksum) exit(0);
#endif
}

bool ScriptoraGuard::validate(const std::string& key) {
    securityCheck();
    std::cout << _X("[>] Initializing secure handshake...") << std::endl;
    
    json creq; creq["appId"] = m_appId; creq["key"] = key;
    std::string cresp_raw = httpPost(API_BASE + "/challenge", creq.dump());
    auto cresp = json::parse(cresp_raw);
    if (cresp.contains("error")) return false;
    
    std::string challenge = cresp["challenge"];
    auto dkey = deriveKey(m_appSecret, challenge);
    
    json vdata;
    vdata["key"] = key; vdata["hwid"] = "win-id-1337"; vdata["nonce"] = std::to_string(rand());
    vdata["timestamp"] = std::time(nullptr) * 1000; vdata["challenge"] = challenge;
    
    std::string ptxt = vdata.dump();
    unsigned char iv[12]; RAND_bytes(iv, 12);
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    unsigned char ctxt[4096]; unsigned char tag[16]; int len; int ctxt_len;
    EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, dkey.data(), iv);
    EVP_EncryptUpdate(ctx, ctxt, &len, (unsigned char*)ptxt.c_str(), ptxt.size());
    ctxt_len = len; EVP_EncryptFinal_ex(ctx, ctxt + len, &len); ctxt_len += len;
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, tag);
    EVP_CIPHER_CTX_free(ctx);

    json payload;
    payload["iv"] = to_hex(iv, 12);
    payload["content"] = to_hex(ctxt, ctxt_len);
    payload["authTag"] = to_hex(tag, 16);
    
    json final_req;
    final_req["appId"] = m_appId;
    final_req["key"] = key;
    final_req["payload"] = payload;
    
    std::cout << _X("[>] Contacting server...") << std::endl;
    std::string vresp_raw = httpPost(API_BASE + "/validate", final_req.dump());
    auto vresp = json::parse(vresp_raw);
    if (vresp.contains("error")) return false;
    
    json rpayload = vresp["payload"];
    auto riv = from_hex(rpayload["iv"]);
    auto rctxt = from_hex(rpayload["content"]);
    auto rtag = from_hex(rpayload["authTag"]);
    
    EVP_CIPHER_CTX* dctx = EVP_CIPHER_CTX_new();
    unsigned char rptxt[4096]; int rlen; int rptxt_len;
    EVP_DecryptInit_ex(dctx, EVP_aes_256_gcm(), NULL, dkey.data(), riv.data());
    EVP_DecryptUpdate(dctx, rptxt, &rlen, rctxt.data(), rctxt.size());
    rptxt_len = rlen;
    EVP_CIPHER_CTX_ctrl(dctx, EVP_CTRL_GCM_SET_TAG, 16, rtag.data());
    int res = EVP_DecryptFinal_ex(dctx, rptxt + rlen, &rlen);
    EVP_CIPHER_CTX_free(dctx);

    if (res <= 0) return false;
    rptxt_len += rlen;
    rptxt[rptxt_len] = '\0';
    auto decrypted = json::parse((char*)rptxt);
    
    std::string expected = sha256(key + challenge + m_appSecret);
    if (decrypted["integrity"] != expected) exit(0);
    
    // --- VERSION CHECK & AUTO-UPDATE ---
    std::string serverVersion = decrypted["version"];
    if (serverVersion != CURRENT_VERSION && !decrypted["downloadUrl"].get<std::string>().empty()) {
        perform_update(decrypted["downloadUrl"]);
    }
    
    m_level = decrypted["level"];
    m_app = decrypted["app"];
    
    std::cout << _X("[+] Access Granted: ") << m_level << std::endl;
    return true;
}

std::string ScriptoraGuard::getLevel() const { return m_level; }
std::string ScriptoraGuard::getApp() const { return m_app; }
long long ScriptoraGuard::getExpiresAt() const { return m_expiresAt; }
