import sys
from chatbot_engine import chat_stream

def main():
    print("=== Bệnh viện AI Chatbot (CLI Testing) ===")
    print("Nhập 'quit' để thoát.")
    
    patient_id = "BN-TEST-001"
    required_services = ["lab", "ultrasound"]
    
    while True:
        query = input("\nBạn: ")
        if query.lower() in ["quit", "exit"]:
            break
            
        print("Bot: ", end="")
        try:
            for chunk in chat_stream(query, patient_id, required_services):
                print(chunk, end="")
                sys.stdout.flush()
        except Exception as e:
            print(f"\n[Lỗi kết nối hoặc API Key: {e}]")
            
if __name__ == "__main__":
    main()
