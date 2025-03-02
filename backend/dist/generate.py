import sys
import json 
from transformers import GPT2LMHeadModel, GPT2Tokenizer

MODEL_NAME = "gpt2"
tokenizer = GPT2Tokenizer.from_pretrained(MODEL_NAME)
model = GPT2LMHeadModel.from_pretrained(MODEL_NAME)

def generate_response(prompt: str) -> str:
    """
    Generate a response from the model given a prompt.
    This is a placeholder using GPT-2; your friend will adapt this for their model.
    """
    try:
        # Tokenize the input prompt
        inputs = tokenizer(prompt, return_tensors="pt")  # "pt" for PyTorch
        
        # Generate response with parameters
        outputs = model.generate(
            inputs["input_ids"],
            max_length=100,        # Max output length; adjust as needed
            temperature=0.7,       # Controls randomness (0.5-1.0 range)
            top_p=0.95,           # Nucleus sampling for coherence
            do_sample=True,       # Enable sampling for varied responses
            pad_token_id=tokenizer.eos_token_id  # Handle padding
        )
        
        # Decode the output to text
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response.strip()
    except Exception as e:
        return f"Error generating response: {str(e)}"

if __name__ == "__main__":
    # Read prompt from command-line argument (passed by Node.js)
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No prompt provided"}))
        sys.exit(1)
    
    prompt = sys.argv[1]
    
    # Generate response
    response = generate_response(prompt)
    
    # Output as JSON for easier parsing in Node.js
    output = {
        "response": response,
        "model": MODEL_NAME  # For debugging; your friend might include their model name
    }
    print(json.dumps(output))