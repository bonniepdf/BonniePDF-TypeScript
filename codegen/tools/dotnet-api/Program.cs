using System.Reflection;
using System.Text.Json;
using BonniePDF;

static string Name(Type type)
{
    if (Nullable.GetUnderlyingType(type) is { } inner) return Name(inner) + "?";
    if (type.IsArray) return Name(type.GetElementType()!) + "[]";
    if (type.IsGenericType) return type.Name.Split('`')[0] + "<" + string.Join(",", type.GetGenericArguments().Select(Name)) + ">";
    return type.FullName ?? type.Name;
}
var assembly = typeof(Document).Assembly;
var types = assembly.ExportedTypes.Where(t => t.Namespace == "BonniePDF").OrderBy(t => t.Name, StringComparer.Ordinal).ToDictionary(t => t.Name, t => new {
    kind = t.IsEnum ? "enum" : "object",
    enumMembers = t.IsEnum ? Enum.GetNames(t).ToDictionary(name => name, name => Convert.ToInt64(Enum.Parse(t, name))) : null,
    properties = t.GetProperties(BindingFlags.Public | BindingFlags.Instance).Where(p => p.GetIndexParameters().Length == 0).OrderBy(p => p.Name, StringComparer.Ordinal).ToDictionary(p => p.Name, p => new { type = Name(p.PropertyType), writable = p.GetSetMethod() is not null, readable = p.GetGetMethod() is not null }),
    constructors = t.GetConstructors().Select(c => c.GetParameters().Select(p => new { name = p.Name, type = Name(p.ParameterType), optional = p.IsOptional }).ToArray()).ToArray(),
});
Console.WriteLine(JsonSerializer.Serialize(new { assembly = assembly.GetName().Name, version = assembly.GetName().Version?.ToString(), types }, new JsonSerializerOptions { WriteIndented = true }));
