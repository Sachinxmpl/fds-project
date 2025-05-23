import sys
import json
import torch
import torch.nn as nn
from torch.nn import functional as F
import pickle

# Hyperparameters from gpt.ipynb
n_embd = 384
n_head = 8
dropout = 0.2
n_layer = 8
block_size = 128

class Head(nn.Module):
    def __init__(self, head_size):
        super().__init__()
        self.key = nn.Linear(n_embd, head_size, bias=False)
        self.query = nn.Linear(n_embd, head_size, bias=False)
        self.value = nn.Linear(n_embd, head_size, bias=False)
        self.register_buffer("tril", torch.tril(torch.ones(block_size, block_size)))
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        B, T, C = x.shape
        k = self.key(x)
        q = self.query(x)
        wei = q @ k.transpose(-2, -1) * k.shape[-1] ** -0.5
        wei = wei.masked_fill(self.tril[:T, :T] == 0, float("-inf"))
        wei = F.softmax(wei, dim=-1)
        wei = self.dropout(wei)
        v = self.value(x)
        out = wei @ v
        return out

class MultiHeadAttention(nn.Module):
    def __init__(self, num_heads, head_size):
        super().__init__()
        self.heads = nn.ModuleList([Head(head_size) for _ in range(num_heads)])
        self.proj = nn.Linear(head_size * num_heads, n_embd)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        out = torch.cat([h(x) for h in self.heads], dim=-1)
        out = self.dropout(self.proj(out))
        return out

class FeedFoward(nn.Module):
    def __init__(self, n_embd):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.ReLU(),
            nn.Linear(4 * n_embd, n_embd),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        return self.net(x)

class Block(nn.Module):
    def __init__(self, n_embd, n_head):
        super().__init__()
        head_size = n_embd // n_head
        self.sa = MultiHeadAttention(n_head, head_size)
        self.ffwd = FeedFoward(n_embd)
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)

    def forward(self, x):
        y = self.sa(x)
        x = self.ln1(x + y)
        y = self.ffwd(x)
        x = self.ln2(x + y)
        return x

class GPTLanguageModel(nn.Module):
    def __init__(self, vocab_size):
        super().__init__()
        self.token_embedding_table = nn.Embedding(vocab_size, n_embd)
        self.position_embedding_table = nn.Embedding(block_size, n_embd)
        self.blocks = nn.Sequential(
            *[Block(n_embd, n_head=n_head) for _ in range(n_layer)]
        )
        self.ln_f = nn.LayerNorm(n_embd)
        self.lm_head = nn.Linear(n_embd, vocab_size)

        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(self, index, targets=None):
        B, T = index.shape
        tok_emb = self.token_embedding_table(index)
        pos_emb = self.position_embedding_table(torch.arange(T, device=device))
        x = tok_emb + pos_emb
        x = self.blocks(x)
        x = self.ln_f(x)
        logits = self.lm_head(x)

        if targets is None:
            loss = None
        else:
            B, T, C = logits.shape
            logits = logits.view(B * T, C)
            targets = targets.view(B * T)
            loss = F.cross_entropy(logits, targets)

        return logits, loss

    def generate(self, index, max_new_tokens):
        for _ in range(max_new_tokens):
            index_cond = index[:, -block_size:]
            logits, loss = self.forward(index_cond)
            logits = logits[:, -1, :]
            probs = F.softmax(logits, dim=-1)
            index_next = torch.multinomial(probs, num_samples=1)
            index = torch.cat((index, index_next), dim=1)
        return index

device = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_PATH = "../../lenisha.pkl"
try:
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
        # Move debug prints to stderr
        print("Loaded data type: " + str(type(data)), file=sys.stderr)
        print("Loaded data keys: " + str(data.keys()), file=sys.stderr)
        model = data["model"]
        if isinstance(model, dict):
            model = model["model"]
        print("Model type: " + str(type(model)), file=sys.stderr)
        chars = data["chars"]
    model.to(device)
    model.eval()
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.exit(1)

string_to_int = {c: i for i, c in enumerate(chars)}
int_to_string = {i: c for i, c in enumerate(chars)}
encode = lambda x: [string_to_int[c] for c in x if c in string_to_int]
decode = lambda x: "".join([int_to_string[i] for i in x if i in int_to_string])
block_size = 128

def generate_response(prompt: str) -> str:
    try:
        context = encode(prompt)
        if not context:
            return "Error: Prompt contains no valid characters"
        context = torch.tensor(context, dtype=torch.long, device=device)
        if len(context) > block_size:
            context = context[-block_size:]
        context = context.unsqueeze(0)
        max_new_tokens = 100
        with torch.no_grad():
            generated = model.generate(context, max_new_tokens=max_new_tokens)
        generated_text = decode(generated[0].tolist())
        if generated_text.startswith(prompt):
            generated_text = generated_text[len(prompt):]
        return generated_text.strip()
    except Exception as e:
        return f"Error generating response: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No prompt provided"}))
        sys.exit(1)
    prompt = sys.argv[1]
    response = generate_response(prompt)
    output = {"response": response, "model": "lenisha-custom-gpt"}
    print(json.dumps(output))