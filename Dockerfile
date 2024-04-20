FROM python:3.11

# Set the working directory to /app
WORKDIR /app

COPY ./app/requirements.txt /app/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the files into the container
COPY /app /app

ENV FLASK_DEBUG=1
EXPOSE 5000

# Set the command to run the application
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]

# EXPOSE 8000
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]