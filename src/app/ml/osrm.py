import requests,polyline,folium

#Pontos para se andar
pontos = [
    {"nome": "Cet", "lat":-5.077325435821074, "lng":-42.82516182905625},
    {"nome": "Random",  "lat":-5.069709406129223, "lng":-42.80965331912888},
]

#Montando uma URL no formato do OSRM: lng1,lat1;lng2,lat2;lng3,lat3...
coordenadas_str = ";".join([f"{p['lng']},{p['lat']}" for p in pontos])

# Endpoint '/trip/v1/driving/' resolve o Problema do Caixeiro Viajante (TSP)
url = f"http://router.project-osrm.org/trip/v1/driving/{coordenadas_str}"

#O parâmetro source=first fixa o primeiro ponto como início e steps=true traz as instruções da rota
params = {
    "source": "first",
    "roundtrip": "true", # 'true' faz voltar ao início; 'false' apenas finaliza no último ponto
    "overview": "simplified",
    "steps": "false"
}

#Fazendo a requisição da api do OSRM
response = requests.get(url, params=params)
data = response.json()

#Processando o resultado
if data["code"] == "Ok":
    distancia_total_km = data["trips"][0]["distance"] / 1000
    tempo_total_min = data["trips"][0]["duration"] / 60

    print("--- ROTA OTIMIZADA (TSP) ---")
    print(f"Distância total: {distancia_total_km:.2f} km")
    print(f"Tempo estimado: {tempo_total_min:.1f} minutos\n")
    
    print("Ordem de visitação dos pontos:")
    #Adquirindo os waypoints
    waypoints = data["waypoints"]

    #Uniformizando os dados dos waypoints
    rota_ordenada = []
    for idx_original,wp in enumerate(waypoints):
        rota_ordenada.append({
            "ordem":wp["waypoint_index"] + 1, #Ordem por onde o motorista deve passar
            "nome":pontos[idx_original]["nome"],
            "lat":wp["location"][1],
            "lng":wp["location"][0]
        })
    #Ordenando rota
    rota_ordenada = sorted(rota_ordenada,key=lambda x: x['ordem'])

    #Mostrando ordem
    for item in rota_ordenada:
        print(f"{item['ordem']}º a visitar -> {item['nome']}")

    #Desenhando a rota
    trip = data["trips"][0]
    coordenadas = polyline.decode(trip["geometry"])

    #Pegando o mapa open source disponível do folium
    #Usando o esri, pois o open street map tem um limite de requisições
    mapa = folium.Map(
    location=coordenadas[0],
    zoom_start=13,
    tiles="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attr="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ")
    #mapa = folium.Map(location=coordenadas[0],zoom_start=13)

    folium.PolyLine(coordenadas,color="blue",weight=5,opacity=0.8).add_to(mapa)

    for item in rota_ordenada:

        #Verde: Parada Inicial
        #Azul: Parada comum
        #Vermelho: Parada Final
        cor = "green" if item["ordem"] == 1 else ("red" if item["ordem"] == len(rota_ordenada) else "blue")

        #Agrupando a marcação do polyline com o mapa do folium
        folium.Marker(
            location=[item["lat"], item["lng"]],
            popup=f"<b>Parada {item['ordem']}</b>: {item['nome']}",
            tooltip=f"{item['ordem']}º - {item['nome']}",
            icon=folium.Icon(color=cor, icon="info-sign")
        ).add_to(mapa)

    #Gerando o mapa com a rota já definida
    mapa.save("rota_osrm.html")
    
else:
    print("Erro ao calcular rota:", data.get("message"))