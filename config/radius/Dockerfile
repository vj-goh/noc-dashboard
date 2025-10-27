FROM freeradius/freeradius-server:latest

# Copy configuration files with proper permissions
COPY --chmod=644 clients.conf /etc/raddb/clients.conf
COPY --chmod=644 users /etc/raddb/mods-config/files/authorize

# Ensure FreeRADIUS can read them
RUN chown -R freerad:freerad /etc/raddb && \
    chmod 755 /etc/raddb && \
    chmod 644 /etc/raddb/clients.conf && \
    chmod 644 /etc/raddb/mods-config/files/authorize

# Run in debug mode
CMD ["radiusd", "-X"]