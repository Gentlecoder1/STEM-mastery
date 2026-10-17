import torch
from transformers import AutoModelForTokenClassification, AutoTokenizer

MODEL_PATH = "models/stem_scibert_final"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

print("Loading model...")
model = AutoModelForTokenClassification.from_pretrained(MODEL_PATH)

text = "Velocity is the rate of change of displacement."

inputs = tokenizer(text, return_tensors="pt", truncation=True)

with torch.no_grad():
    outputs = model(**inputs)

predictions = torch.argmax(outputs.logits, dim=-1)

tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
predicted_ids = predictions[0].tolist()

print("\nModel loaded successfully.")
print("Tokens and predicted label IDs:")

for token, label_id in zip(tokens, predicted_ids, strict=False):
    print(token, "->", label_id)

