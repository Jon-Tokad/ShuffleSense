import sagemaker
import boto3
from sagemaker.huggingface import HuggingFaceModel

# 1) Get or create a SageMaker execution role
try:
    role = sagemaker.get_execution_role()
except ValueError:
    iam = boto3.client('iam')
    role = iam.get_role(RoleName='sagemaker_execution_role')['Role']['Arn']

print("Using SageMaker IAM role:", role)

# 2) Define the Hub Model configuration
hub = {
    'HF_MODEL_ID': 'dima806/music_genres_classification',  # your model on HF Hub
    'HF_TASK': 'audio-classification',                     # pipeline/task name
}

# 3) Create a HuggingFaceModel
huggingface_model = HuggingFaceModel(
    env=hub,
    role=role,
    transformers_version="4.26",  # or 4.27, etc.
    pytorch_version="1.13",       # must be compatible with transformers_version
    py_version="py39"
)
